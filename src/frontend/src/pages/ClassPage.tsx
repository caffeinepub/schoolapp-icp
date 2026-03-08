import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  Loader2,
  Save,
  Star,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ClassInfo } from "../backend.d";
import {
  useAddStudent,
  useGetAttendance,
  useGetClassGrades,
  useListStudents,
  useRemoveStudent,
  useSaveAttendance,
  useSaveScore,
} from "../hooks/useQueries";

interface ClassPageProps {
  cls: ClassInfo;
  onBack: () => void;
}

// ─── Attendance Tab ──────────────────────────────────────────────────────────

function AttendanceTab({ classId }: { classId: bigint }) {
  const today = new Date().toISOString().split("T")[0];
  const studentsQuery = useListStudents(classId);
  const attendanceQuery = useGetAttendance(classId, today);
  const saveAttendance = useSaveAttendance();

  // absentIds = set of student IDs that are absent (unchecked)
  const [absentIds, setAbsentIds] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  const students = studentsQuery.data ?? [];

  // Initialize absent set from fetched attendance data
  useEffect(() => {
    if (attendanceQuery.data && !initialized && !attendanceQuery.isFetching) {
      setAbsentIds(new Set(attendanceQuery.data.map((id) => id.toString())));
      setInitialized(true);
    }
  }, [attendanceQuery.data, attendanceQuery.isFetching, initialized]);

  const handleEveryonePresent = () => {
    setAbsentIds(new Set());
  };

  const toggleStudent = (studentId: bigint) => {
    const key = studentId.toString();
    setAbsentIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      const absentBigints = students
        .filter((s) => absentIds.has(s.id.toString()))
        .map((s) => s.id);
      await saveAttendance.mutateAsync({
        classId,
        date: today,
        absentIds: absentBigints,
      });
      toast.success("Opgeslagen!", {
        description: `Presentie voor ${today} opgeslagen`,
      });
    } catch {
      toast.error("Opslaan mislukt. Probeer opnieuw.");
    }
  };

  const isLoading = studentsQuery.isLoading || attendanceQuery.isLoading;
  const presentCount = students.length - absentIds.size;

  return (
    <div className="space-y-4">
      {/* Date + summary bar */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-5 w-5" />
          <span className="text-base font-medium">{today}</span>
        </div>
        <div className="text-base font-semibold text-foreground">
          {presentCount}/{students.length} aanwezig
        </div>
      </div>

      {/* Everyone present button */}
      <Button
        data-ocid="attendance.everyone_present_button"
        onClick={handleEveryonePresent}
        className="w-full h-16 text-xl font-display font-bold bg-success hover:bg-success/90 text-success-foreground rounded-xl gap-3 shadow-sm"
      >
        <CheckSquare className="h-6 w-6" />
        Iedereen Aanwezig
      </Button>

      {/* Student list */}
      {isLoading ? (
        <div data-ocid="attendance.loading_state" className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div
          data-ocid="attendance.empty_state"
          className="text-center py-12 text-muted-foreground"
        >
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">Geen leerlingen in deze klas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student, idx) => {
            const isPresent = !absentIds.has(student.id.toString());
            return (
              <motion.div
                key={student.id.toString()}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                  isPresent
                    ? "bg-success/5 border-success/30"
                    : "bg-destructive/5 border-destructive/20"
                }`}
                onClick={() => toggleStudent(student.id)}
              >
                <Checkbox
                  checked={isPresent}
                  onCheckedChange={() => toggleStudent(student.id)}
                  className="h-7 w-7 rounded-lg border-2 data-[state=checked]:bg-success data-[state=checked]:border-success"
                />
                <span
                  className={`text-lg font-semibold flex-1 ${
                    isPresent
                      ? "text-foreground"
                      : "text-muted-foreground line-through"
                  }`}
                >
                  {student.name}
                </span>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    isPresent
                      ? "bg-success/20 text-success"
                      : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {isPresent ? "Aanwezig" : "Afwezig"}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Save button */}
      {students.length > 0 && (
        <Button
          data-ocid="attendance.save_button"
          onClick={() => void handleSave()}
          disabled={saveAttendance.isPending}
          className="w-full h-16 text-xl font-display font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-3 mt-4"
        >
          {saveAttendance.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Opslaan…
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Opslaan
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ─── Grades Tab ──────────────────────────────────────────────────────────────

function GradesTab({ classId }: { classId: bigint }) {
  const gradesQuery = useGetClassGrades(classId);
  const saveScore = useSaveScore();

  // Local score state: studentId -> score string
  const [scores, setScores] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  const grades = gradesQuery.data;

  useEffect(() => {
    if (grades && !initialized && !gradesQuery.isFetching) {
      const initial: Record<string, string> = {};
      for (const g of grades.studentGrades) {
        initial[g.studentId.toString()] =
          g.score != null ? g.score.toString() : "";
      }
      setScores(initial);
      setInitialized(true);
    }
  }, [grades, gradesQuery.isFetching, initialized]);

  const handleSaveAll = async () => {
    if (!grades) return;
    try {
      const mutations = grades.studentGrades
        .filter((g) => {
          const val = scores[g.studentId.toString()];
          return val !== undefined && val !== "";
        })
        .map((g) => {
          const val = Number(scores[g.studentId.toString()]);
          return saveScore.mutateAsync({
            studentId: g.studentId,
            score: BigInt(Math.max(0, Math.min(100, Math.round(val)))),
            classId,
          });
        });
      await Promise.all(mutations);
      toast.success("Opgeslagen!", { description: "Cijfers opgeslagen" });
    } catch {
      toast.error("Opslaan mislukt. Probeer opnieuw.");
    }
  };

  if (gradesQuery.isLoading) {
    return (
      <div data-ocid="grades.loading_state" className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!grades || grades.studentGrades.length === 0) {
    return (
      <div
        data-ocid="grades.empty_state"
        className="text-center py-12 text-muted-foreground"
      >
        <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg">Geen leerlingen in deze klas</p>
      </div>
    );
  }

  const average = grades.average;
  const filledScores = grades.studentGrades.filter((g) => {
    const val = scores[g.studentId.toString()];
    return val !== undefined && val !== "";
  });

  return (
    <div className="space-y-4">
      {/* Average bar */}
      <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
        <span className="text-base font-semibold text-foreground">
          Klasgemiddelde
        </span>
        <span className="text-2xl font-display font-bold text-primary">
          {average != null
            ? average.toString()
            : filledScores.length > 0
              ? Math.round(
                  filledScores.reduce((sum, g) => {
                    const val = Number(scores[g.studentId.toString()]);
                    return sum + (Number.isNaN(val) ? 0 : val);
                  }, 0) / filledScores.length,
                )
              : "—"}
        </span>
      </div>

      {/* Student grade inputs */}
      <div className="space-y-2">
        {grades.studentGrades.map((g, idx) => (
          <motion.div
            key={g.studentId.toString()}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3"
          >
            <span className="flex-1 text-lg font-semibold text-foreground">
              {g.studentName}
            </span>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="—"
              value={scores[g.studentId.toString()] ?? ""}
              onChange={(e) =>
                setScores((prev) => ({
                  ...prev,
                  [g.studentId.toString()]: e.target.value,
                }))
              }
              className="w-24 h-14 text-center text-2xl font-display font-bold rounded-xl border-2 border-border focus:border-primary"
            />
          </motion.div>
        ))}
      </div>

      {/* Save button */}
      <Button
        data-ocid="grades.save_button"
        onClick={() => void handleSaveAll()}
        disabled={saveScore.isPending}
        className="w-full h-16 text-xl font-display font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-3 mt-2"
      >
        {saveScore.isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Opslaan…
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Opslaan
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Students Tab ─────────────────────────────────────────────────────────────

function StudentsTab({ classId }: { classId: bigint }) {
  const studentsQuery = useListStudents(classId);
  const addStudent = useAddStudent();
  const removeStudent = useRemoveStudent();

  const [newName, setNewName] = useState("");

  const students = studentsQuery.data ?? [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    try {
      await addStudent.mutateAsync({ classId, name });
      setNewName("");
      toast.success(`${name} toegevoegd`);
    } catch {
      toast.error("Toevoegen mislukt");
    }
  };

  const handleRemove = async (studentId: bigint, studentName: string) => {
    try {
      await removeStudent.mutateAsync({ studentId, classId });
      toast.success(`${studentName} verwijderd`);
    } catch {
      toast.error("Verwijderen mislukt");
    }
  };

  return (
    <div className="space-y-4">
      {/* Add student form */}
      <form
        onSubmit={(e) => void handleAdd(e)}
        className="flex gap-3 bg-card border border-border rounded-2xl p-4"
      >
        <Input
          data-ocid="students.add_input"
          type="text"
          placeholder="Naam van leerling"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 h-14 text-lg rounded-xl"
        />
        <Button
          data-ocid="students.add_button"
          type="submit"
          disabled={addStudent.isPending || !newName.trim()}
          className="h-14 px-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-lg gap-2 shrink-0"
        >
          {addStudent.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              Toevoegen
            </>
          )}
        </Button>
      </form>

      {/* Students list */}
      {studentsQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div
          data-ocid="students.empty_state"
          className="text-center py-12 text-muted-foreground"
        >
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">Nog geen leerlingen</p>
          <p className="text-base mt-1">
            Voeg de eerste leerling toe via het veld hierboven.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student, idx) => (
            <motion.div
              key={student.id.toString()}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              layout
              className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3"
            >
              <span className="flex-1 text-lg font-semibold text-foreground">
                {student.name}
              </span>
              <Button
                data-ocid={`students.delete_button.${idx + 1}`}
                size="sm"
                variant="destructive"
                onClick={() => void handleRemove(student.id, student.name)}
                disabled={removeStudent.isPending}
                className="h-12 w-12 p-0 rounded-xl"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Class Page ──────────────────────────────────────────────────────────

export default function ClassPage({ cls, onBack }: ClassPageProps) {
  const [tab, setTab] = useState("attendance");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-5 py-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-1">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="h-11 w-11 p-0 text-primary-foreground hover:bg-primary-foreground/10 rounded-xl"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-display font-bold text-xl">{cls.name}</h1>
        </div>
      </header>

      {/* Tabs */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full h-14 bg-muted rounded-xl mb-6 p-1">
            <TabsTrigger
              data-ocid="class.attendance_tab"
              value="attendance"
              className="flex-1 h-12 rounded-lg text-base font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              Presentie
            </TabsTrigger>
            <TabsTrigger
              data-ocid="class.grades_tab"
              value="grades"
              className="flex-1 h-12 rounded-lg text-base font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2"
            >
              <Star className="h-4 w-4" />
              Cijfers
            </TabsTrigger>
            <TabsTrigger
              data-ocid="class.students_tab"
              value="students"
              className="flex-1 h-12 rounded-lg text-base font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2"
            >
              <Users className="h-4 w-4" />
              Leerlingen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <AttendanceTab classId={cls.id} />
          </TabsContent>

          <TabsContent value="grades">
            <GradesTab classId={cls.id} />
          </TabsContent>

          <TabsContent value="students">
            <StudentsTab classId={cls.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
