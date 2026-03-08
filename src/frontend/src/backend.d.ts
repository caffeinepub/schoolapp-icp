import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface StudentGrade {
    studentId: bigint;
    studentName: string;
    score?: bigint;
}
export interface ClassGrades {
    studentGrades: Array<StudentGrade>;
    average?: bigint;
}
export interface StudentInfo {
    id: bigint;
    name: string;
    classId: bigint;
}
export interface ClassInfo {
    id: bigint;
    name: string;
}
export interface UserProfile {
    name: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addStudent(classId: bigint, name: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createClass(name: string): Promise<bigint>;
    deleteClass(classId: bigint): Promise<void>;
    getAttendance(classId: bigint, date: string): Promise<Array<bigint>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClassGrades(classId: bigint): Promise<ClassGrades>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listClasses(): Promise<Array<ClassInfo>>;
    listStudents(classId: bigint): Promise<Array<StudentInfo>>;
    removeStudent(studentId: bigint): Promise<void>;
    requestApproval(): Promise<void>;
    saveAttendance(classId: bigint, date: string, absentIds: Array<bigint>): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveScore(studentId: bigint, score: bigint): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
}
