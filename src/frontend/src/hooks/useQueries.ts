import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApprovalStatus, UserProfile } from "../backend.d";
import { useActor } from "./useActor";

// ─── Auth ────────────────────────────────────────────────────────────────────

export function useIsApproved() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isApproved"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerApproved();
      } catch {
        // User not yet registered — treat as not approved
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        // User not yet registered — treat as not admin
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Geen verbinding");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Geen verbinding");
      return actor.requestApproval();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["isApproved"] });
    },
  });
}

// ─── Approvals (admin) ────────────────────────────────────────────────────────

export function useListApprovals() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserProfile(principal: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      status,
    }: {
      principal: Principal;
      status: ApprovalStatus;
    }) => {
      if (!actor) throw new Error("Geen verbinding");
      return actor.setApproval(principal, status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export function useListClasses() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listClasses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateClass() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Geen verbinding");
      return actor.createClass(name);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useDeleteClass() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (classId: bigint) => {
      if (!actor) throw new Error("Geen verbinding");
      return actor.deleteClass(classId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

// ─── Students ─────────────────────────────────────────────────────────────────

export function useListStudents(classId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["students", classId?.toString()],
    queryFn: async () => {
      if (!actor || classId === null) return [];
      return actor.listStudents(classId);
    },
    enabled: !!actor && !isFetching && classId !== null,
  });
}

export function useAddStudent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      name,
    }: {
      classId: bigint;
      name: string;
    }) => {
      if (!actor) throw new Error("Geen verbinding");
      return actor.addStudent(classId, name);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["students", variables.classId.toString()],
      });
    },
  });
}

export function useRemoveStudent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      classId: _classId,
    }: {
      studentId: bigint;
      classId: bigint;
    }) => {
      if (!actor) throw new Error("Geen verbinding");
      return actor.removeStudent(studentId);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["students", variables.classId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["grades", variables.classId.toString()],
      });
    },
  });
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export function useGetAttendance(classId: bigint | null, date: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["attendance", classId?.toString(), date],
    queryFn: async () => {
      if (!actor || classId === null) return [];
      return actor.getAttendance(classId, date);
    },
    enabled: !!actor && !isFetching && classId !== null,
  });
}

export function useSaveAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      date,
      absentIds,
    }: {
      classId: bigint;
      date: string;
      absentIds: bigint[];
    }) => {
      if (!actor) throw new Error("Geen verbinding");
      return actor.saveAttendance(classId, date, absentIds);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["attendance", variables.classId.toString(), variables.date],
      });
    },
  });
}

// ─── Grades ──────────────────────────────────────────────────────────────────

export function useGetClassGrades(classId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["grades", classId?.toString()],
    queryFn: async () => {
      if (!actor || classId === null) return null;
      return actor.getClassGrades(classId);
    },
    enabled: !!actor && !isFetching && classId !== null,
  });
}

export function useSaveScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      score,
      classId: _classId,
    }: {
      studentId: bigint;
      score: bigint;
      classId: bigint;
    }) => {
      if (!actor) throw new Error("Geen verbinding");
      return actor.saveScore(studentId, score);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["grades", variables.classId.toString()],
      });
    },
  });
}
