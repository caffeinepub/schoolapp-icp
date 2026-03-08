import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type UserProfile = { name : Text };
  type ClassInfo = { id : Nat; name : Text };
  type StudentInfo = { id : Nat; classId : Nat; name : Text };
  type StudentGrade = { studentId : Nat; studentName : Text; score : ?Nat };
  type ClassGrades = { studentGrades : [StudentGrade]; average : ?Nat };

  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);
  include MixinAuthorization(accessControlState);

  var userNames = Map.empty<Principal, Text>();
  var classes = Map.empty<Nat, Text>();
  var nextClassId = 1;
  var students = Map.empty<Nat, (Nat, Text)>();
  var nextStudentId = 1;
  var attendance = Map.empty<Text, [Nat]>();
  var grades = Map.empty<Nat, Nat>();

  func isApprovedOrAdmin(caller : Principal) : Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  // User approval
  public query ({ caller }) func isCallerApproved() : async Bool {
    isApprovedOrAdmin(caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  // User profiles
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (userNames.isEmpty()) {
      // First user: directly assign admin role without any token or system context
      accessControlState.userRoles.add(caller, #admin);
      accessControlState.adminAssigned := true;
      UserApproval.setApproval(approvalState, caller, #approved);
    };
    userNames.add(caller, profile.name);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    switch (userNames.get(caller)) {
      case (?name) ?{ name };
      case null null;
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (userNames.get(user)) {
      case (?name) ?{ name };
      case null null;
    };
  };

  // Classes
  public shared ({ caller }) func createClass(name : Text) : async Nat {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    let id = nextClassId;
    nextClassId += 1;
    classes.add(id, name);
    id;
  };

  public query ({ caller }) func listClasses() : async [ClassInfo] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    var result : [ClassInfo] = [];
    for ((id, name) in classes.entries()) {
      result := result.concat([{ id; name }]);
    };
    result;
  };

  public shared ({ caller }) func deleteClass(classId : Nat) : async () {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    classes.remove(classId);
  };

  // Students
  public shared ({ caller }) func addStudent(classId : Nat, name : Text) : async Nat {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    let id = nextStudentId;
    nextStudentId += 1;
    students.add(id, (classId, name));
    id;
  };

  public query ({ caller }) func listStudents(classId : Nat) : async [StudentInfo] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    var result : [StudentInfo] = [];
    for ((id, (cid, name)) in students.entries()) {
      if (cid == classId) {
        result := result.concat([{ id; classId = cid; name }]);
      };
    };
    result;
  };

  public shared ({ caller }) func removeStudent(studentId : Nat) : async () {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    students.remove(studentId);
    grades.remove(studentId);
  };

  // Attendance
  func attendanceKey(classId : Nat, date : Text) : Text {
    debug_show (classId) # ":" # date;
  };

  public shared ({ caller }) func saveAttendance(classId : Nat, date : Text, absentIds : [Nat]) : async () {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    attendance.add(attendanceKey(classId, date), absentIds);
  };

  public query ({ caller }) func getAttendance(classId : Nat, date : Text) : async [Nat] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    switch (attendance.get(attendanceKey(classId, date))) {
      case (?ids) ids;
      case null [];
    };
  };

  // Grades
  public shared ({ caller }) func saveScore(studentId : Nat, score : Nat) : async () {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    grades.add(studentId, score);
  };

  public query ({ caller }) func getClassGrades(classId : Nat) : async ClassGrades {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };

    var result : [StudentGrade] = [];
    var total : Nat = 0;
    var count : Nat = 0;
    for ((id, (cid, name)) in students.entries()) {
      if (cid == classId) {
        let score = grades.get(id);
        switch (score) {
          case (?s) {
            total += s;
            count += 1;
          };
          case null {};
        };
        result := result.concat([{ studentId = id; studentName = name; score }]);
      };
    };
    let average : ?Nat = if (count == 0) { null } else { ?(total / count) };
    { studentGrades = result; average };
  };
};
