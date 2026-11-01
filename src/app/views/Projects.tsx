import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Undo2,
  CheckCircle2,
  FolderKanban,
  ListTodo,
  Flame,
  Clock,
  PauseCircle,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { useStore } from "../store";
import { PageHead, Bar, Tick, Segmented, Empty, Modal, TINTS, tintBg, ConfirmButton } from "../ui";
import { addDays, daysBetween, fmtDateShort, parseYmd, startOfDay, ymd } from "../dates";
import type { Project, ProjectStatus, TaskPriority, TaskStatus, Tint } from "../types";
import { cn } from "@/lib/utils";

const PROJECT_ICONS = [
  "🚀", "💻", "💼", "🌐", "📱", "🎨", "📊", "🛠️", "📦", "🏢", "🎯", "⚡",
  "📝", "📚", "🧠", "💡", "🛒", "🎬", "🎥", "🎤", "🏗️", "🔬", "🌱", "🤝",
  "🏆", "💎", "🔥", "🧭", "🗂️", "📌",
];

const PROJECT_CATEGORIES = [
  "Kerja",
  "Freelance",
  "Portofolio",
  "Bisnis",
  "Pribadi",
  "Belajar",
];

const PRIORITY_META: Record<TaskPriority, { label: string; badge: string; dot: string; weight: number }> = {
  tinggi: {
    label: "Tinggi",
    badge: "bg-coral/15 text-coral border-coral/30",
    dot: "bg-coral",
    weight: 3,
  },
  sedang: {
    label: "Sedang",
    badge: "bg-amber/15 text-amber border-amber/30",
    dot: "bg-amber",
    weight: 2,
  },
  rendah: {
    label: "Rendah",
    badge: "bg-sky/15 text-sky border-sky/30",
    dot: "bg-sky",
    weight: 1,
  },
};

const STATUS_META: Record<TaskStatus, { label: string; style: string }> = {
  todo: {
    label: "To-Do",
    style: "bg-surface2 text-ink2 border-line",
  },
  proses: {
    label: "Proses",
    style: "bg-brand/15 text-brand border-brand/30",
  },
  selesai: {
    label: "Selesai",
    style: "bg-mint/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
};

const nextPriority = (p: TaskPriority): TaskPriority =>
  p === "rendah" ? "sedang" : p === "sedang" ? "tinggi" : "rendah";

const nextStatus = (s: TaskStatus): TaskStatus =>
  s === "todo" ? "proses" : s === "proses" ? "selesai" : "todo";

export const Projects = () => {
  const { data, toggleProjectTask, updateProjectTask, deleteProjectTask } = useStore();
  const projects = data.projects || [];
  const allTasks = data.projectTasks || [];

  const [statusTab, setStatusTab] = useState<ProjectStatus | "semua">("aktif");
  const [viewMode, setViewMode] = useState<"proyek" | "task">("proyek");
  const [taskFilter, setTaskFilter] = useState<"semua" | "belum" | "tinggi" | "proses">("belum");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === "aktif").length;
    const completedProjects = projects.filter((p) => p.status === "selesai").length;
    const totalTasks = allTasks.length;
    const doneTasks = allTasks.filter((t) => t.is_done).length;
    const inProgressTasks = allTasks.filter((t) => !t.is_done && t.status === "proses").length;
    const highPriorityPending = allTasks.filter((t) => !t.is_done && t.priority === "tinggi").length;
    const overallPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    return {
      activeProjects,
      completedProjects,
      totalTasks,
      doneTasks,
      inProgressTasks,
      highPriorityPending,
      overallPct,
    };
  }, [projects, allTasks]);

  const filteredProjects = useMemo(() => {
    if (statusTab === "semua") return projects;
    return projects.filter((p) => p.status === statusTab);
  }, [projects, statusTab]);

  const projectMap = useMemo(() => {
    const m = new Map<string, Project>();
    for (const p of projects) m.set(p.id, p);
    return m;
  }, [projects]);

  const flatTasks = useMemo(() => {
    return allTasks
      .filter((t) => {
        if (taskFilter === "belum") return !t.is_done;
        if (taskFilter === "tinggi") return !t.is_done && t.priority === "tinggi";
        if (taskFilter === "proses") return !t.is_done && t.status === "proses";
        return true;
      })
      .sort((a, b) => {
        if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;
        const pw = PRIORITY_META[b.priority || "sedang"].weight - PRIORITY_META[a.priority || "sedang"].weight;
        if (pw !== 0) return pw;
        return a.order_index - b.order_index;
      });
  }, [allTasks, taskFilter]);

  const openNewModal = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="Manajemen Eksekusi"
        title="To-Do Project"
        text="Kelola seluruh proyek yang sedang kamu jalankan beserta daftar task harian agar setiap proyek selesai tepat waktu."
        action={
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={16} /> Proyek baru
          </button>
        }
      />

      {/* Ringkasan KPI Proyek & Task */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Proyek Aktif</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky/20 text-ink">
              <FolderKanban size={16} />
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{stats.activeProjects}</p>
          <p className="mt-0.5 text-xs text-mute">
            {stats.completedProjects} proyek selesai · {projects.length} total
          </p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Progres Task</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-mint/25 text-ink">
              <ListTodo size={16} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="font-display text-2xl font-bold text-ink">
              {stats.doneTasks}
              <span className="text-sm font-normal text-mute">/{stats.totalTasks}</span>
            </p>
            <span className="text-xs font-extrabold text-brand">{stats.overallPct}%</span>
          </div>
          <div className="mt-2">
            <Bar value={stats.overallPct} tint="mint" h={6} />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Sedang Dikerjakan</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-lilac/25 text-ink">
              <Clock size={16} />
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{stats.inProgressTasks}</p>
          <p className="mt-0.5 text-xs text-mute">Task berstatus Proses saat ini</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Prioritas Tinggi</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-coral/20 text-coral">
              <Flame size={16} />
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{stats.highPriorityPending}</p>
          <p className="mt-0.5 text-xs text-mute">Task penting belum selesai</p>
        </div>
      </div>

      {/* Bar Filter & Mode Tampilan */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {viewMode === "proyek" ? (
          <Segmented
            value={statusTab}
            onChange={setStatusTab}
            options={[
              { v: "aktif", l: `Aktif (${projects.filter((p) => p.status === "aktif").length})` },
              { v: "ditunda", l: `Ditunda (${projects.filter((p) => p.status === "ditunda").length})` },
              { v: "selesai", l: `Selesai (${projects.filter((p) => p.status === "selesai").length})` },
              { v: "semua", l: "Semua" },
            ]}
          />
        ) : (
          <Segmented
            value={taskFilter}
            onChange={setTaskFilter}
            options={[
              { v: "belum", l: `Belum Selesai (${allTasks.filter((t) => !t.is_done).length})` },
              { v: "proses", l: `Sedang Proses (${stats.inProgressTasks})` },
              { v: "tinggi", l: `Prioritas Tinggi (${stats.highPriorityPending})` },
              { v: "semua", l: `Semua Task (${allTasks.length})` },
            ]}
          />
        )}

        <Segmented
          value={viewMode}
          onChange={setViewMode}
          options={[
            { v: "proyek", l: "📁 Per Proyek" },
            { v: "task", l: "✅ Semua Task" },
          ]}
        />
      </div>

      {/* Mode 1: Tampilan Per Proyek */}
      {viewMode === "proyek" ? (
        filteredProjects.length === 0 ? (
          <Empty
            icon={statusTab === "aktif" ? "🚀" : statusTab === "selesai" ? "🏆" : "🗂️"}
            title={
              projects.length === 0
                ? "Belum ada proyek yang dicatat"
                : statusTab === "aktif"
                  ? "Tidak ada proyek aktif"
                  : "Daftar masih kosong"
            }
            text={
              projects.length === 0
                ? "Buat proyek pertamamu dan pecah menjadi daftar task yang jelas agar pekerjaanmu lebih terstruktur."
                : "Proyek dengan status ini akan tampil di sini."
            }
            action={
              statusTab === "aktif" && (
                <button className="btn btn-primary" onClick={openNewModal}>
                  <Plus size={16} /> Buat proyek pertama
                </button>
              )
            }
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={() => openEditModal(project)}
              />
            ))}
          </div>
        )
      ) : (
        /* Mode 2: Tampilan Semua Task Lintas Proyek */
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">Daftar Eksekusi Task</h3>
              <p className="text-xs text-mute">
                Klik badge status atau prioritas untuk mengubahnya secara langsung.
              </p>
            </div>
            <button className="btn btn-ghost py-1.5 text-xs" onClick={openNewModal}>
              <Plus size={14} /> Proyek baru
            </button>
          </div>

          {flatTasks.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-3xl">✨</p>
              <p className="mt-2 font-semibold text-ink">Tidak ada task pada filter ini</p>
              <p className="mt-1 text-xs text-mute">
                Semua task sudah beres atau tambahkan task baru di dalam kartu proyek.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {flatTasks.map((t) => {
                const proj = projectMap.get(t.project_id);
                const prio = PRIORITY_META[t.priority || "sedang"];
                const st = STATUS_META[t.is_done ? "selesai" : t.status || "todo"];
                return (
                  <li
                    key={t.id}
                    className="group flex flex-wrap items-center justify-between gap-3 py-3 transition hover:bg-surface2/50 px-2 rounded-xl"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Tick
                        on={t.is_done}
                        onClick={() => toggleProjectTask(t.id)}
                        label={`Centang ${t.title}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm",
                            t.is_done ? "text-mute line-through" : "font-semibold text-ink"
                          )}
                        >
                          {t.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-mute">
                          {proj && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-surface2 px-2 py-0.5 font-semibold text-ink2">
                              <span>{proj.icon}</span> {proj.name}
                            </span>
                          )}
                          {t.due_date && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={11} /> {fmtDateShort(parseYmd(t.due_date))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Klik untuk ubah status task"
                        onClick={() =>
                          updateProjectTask(t.id, { status: nextStatus(t.status || "todo") })
                        }
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition hover:scale-105",
                          st.style
                        )}
                      >
                        {st.label}
                      </button>

                      <button
                        type="button"
                        title="Klik untuk ubah prioritas"
                        onClick={() =>
                          updateProjectTask(t.id, { priority: nextPriority(t.priority || "sedang") })
                        }
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition hover:scale-105",
                          prio.badge
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", prio.dot)} />
                        {prio.label}
                      </button>

                      <button
                        type="button"
                        aria-label="Hapus task"
                        onClick={() => deleteProjectTask(t.id)}
                        className="text-mute opacity-70 transition hover:text-coral group-hover:opacity-100"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <ProjectModal
        open={modalOpen}
        initial={editingProject}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

const ProjectCard = ({
  project,
  onEdit,
}: {
  project: Project;
  onEdit: () => void;
}) => {
  const s = useStore();
  const tasks = (s.data.projectTasks || [])
    .filter((t) => t.project_id === project.id)
    .sort((a, b) => {
      if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;
      const pw =
        PRIORITY_META[b.priority || "sedang"].weight -
        PRIORITY_META[a.priority || "sedang"].weight;
      if (pw !== 0) return pw;
      return a.order_index - b.order_index;
    });

  const doneCount = tasks.filter((t) => t.is_done).length;
  const inProgressCount = tasks.filter((t) => !t.is_done && t.status === "proses").length;
  const pct =
    project.status === "selesai"
      ? 100
      : tasks.length > 0
        ? Math.round((doneCount / tasks.length) * 100)
        : 0;

  const left = project.due_date
    ? daysBetween(startOfDay(new Date()), parseYmd(project.due_date))
    : null;

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("sedang");
  const [newTaskDue, setNewTaskDue] = useState("");

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    s.addProjectTask(project.id, {
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      due_date: newTaskDue || undefined,
    });
    setNewTaskTitle("");
    setNewTaskDue("");
  };

  return (
    <article className="card flex flex-col overflow-hidden">
      {/* Header Proyek */}
      <div className={cn("p-5", tintBg[project.color || "sky"])}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-surface/80 px-2.5 py-0.5 text-[11px] font-bold text-ink shadow-2xs">
                <span>{project.icon || "🚀"}</span> {project.category || "Proyek"}
              </span>
              {project.status === "ditunda" && (
                <span className="rounded-full bg-amber/20 px-2.5 py-0.5 text-[11px] font-bold text-ink">
                  ⏸️ Ditunda
                </span>
              )}
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink2">
                {project.status === "selesai"
                  ? `Selesai ${project.completed_at ? fmtDateShort(new Date(project.completed_at)) : ""}`
                  : left !== null
                    ? left >= 0
                      ? `${left} hari lagi · ${fmtDateShort(parseYmd(project.due_date!))}`
                      : `Lewat tenggat ${-left} hari`
                    : "Proyek berjalan"}
              </span>
            </div>

            <h3 className="mt-2 font-display text-[22px] font-semibold leading-tight text-ink">
              {project.name}
            </h3>

            {project.description && (
              <p className="mt-1.5 text-sm text-ink2">{project.description}</p>
            )}
          </div>

          {/* Lingkaran Progres */}
          <div className="relative grid h-16 w-16 shrink-0 place-items-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="var(--surface)"
                strokeWidth="4"
              />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke={`var(--${project.color || "sky"})`}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
              />
            </svg>
            <span className="text-sm font-extrabold text-ink">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Body Daftar Task */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="eyebrow">
              Task Proyek · {doneCount}/{tasks.length} selesai
            </p>
            {inProgressCount > 0 && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">
                {inProgressCount} sedang dikerjakan
              </span>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-4 text-center text-xs text-mute">
              Belum ada task di proyek ini. Tambahkan task di bawah untuk mulai mencicil pekerjaan.
            </div>
          ) : (
            <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
              {tasks.map((t) => {
                const prio = PRIORITY_META[t.priority || "sedang"];
                const st = STATUS_META[t.is_done ? "selesai" : t.status || "todo"];
                return (
                  <li
                    key={t.id}
                    className="group flex items-center gap-2.5 rounded-[12px] border border-transparent bg-surface2/50 px-2.5 py-2 transition hover:border-line hover:bg-surface2"
                  >
                    <Tick
                      on={t.is_done}
                      onClick={() => s.toggleProjectTask(t.id)}
                      label={`Centang ${t.title}`}
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          t.is_done ? "text-mute line-through" : "font-semibold text-ink"
                        )}
                      >
                        {t.title}
                      </p>
                      {t.due_date && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-mute">
                          <Calendar size={10} /> Tenggat: {fmtDateShort(parseYmd(t.due_date))}
                        </p>
                      )}
                    </div>

                    {/* Status Pill (To-Do -> Proses -> Selesai) */}
                    <button
                      type="button"
                      title="Klik untuk ubah status (To-Do / Proses / Selesai)"
                      onClick={() =>
                        s.updateProjectTask(t.id, { status: nextStatus(t.status || "todo") })
                      }
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold transition hover:scale-105",
                        st.style
                      )}
                    >
                      {st.label}
                    </button>

                    {/* Priority Pill (Rendah -> Sedang -> Tinggi) */}
                    <button
                      type="button"
                      title="Klik untuk ubah prioritas task"
                      onClick={() =>
                        s.updateProjectTask(t.id, {
                          priority: nextPriority(t.priority || "sedang"),
                        })
                      }
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold transition hover:scale-105",
                        prio.badge
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", prio.dot)} />
                      {prio.label}
                    </button>

                    <button
                      type="button"
                      aria-label="Hapus task"
                      onClick={() => s.deleteProjectTask(t.id)}
                      className="shrink-0 text-mute opacity-60 transition hover:text-coral group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Form Tambah Task Cepat */}
          {project.status !== "selesai" && (
            <form onSubmit={handleAddTask} className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  className="field flex-1 py-2 text-sm"
                  placeholder="Tambah task baru…"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  aria-label="Nama task baru"
                />
                <select
                  aria-label="Prioritas task"
                  className="field w-28 py-2 text-xs font-semibold"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                >
                  <option value="tinggi">🔥 Tinggi</option>
                  <option value="sedang">⚡ Sedang</option>
                  <option value="rendah">🌱 Rendah</option>
                </select>
                <button
                  type="submit"
                  className="btn btn-primary px-3 py-2"
                  aria-label="Tambah task"
                >
                  <Plus size={16} />
                </button>
              </div>
              {newTaskTitle.trim().length > 0 && (
                <div className="flex items-center gap-2 text-xs text-mute">
                  <span>Tenggat task (opsional):</span>
                  <input
                    type="date"
                    className="field w-auto py-1 px-2 text-xs"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                  />
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer Aksi Proyek */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <div className="flex flex-wrap gap-1.5">
            {project.status === "aktif" ? (
              <>
                <button
                  type="button"
                  className="btn btn-ghost py-1.5 text-xs"
                  onClick={() => {
                    s.setProjectStatus(project.id, "selesai");
                    s.toast(`Proyek "${project.name}" selesai! Luar biasa 🎉`);
                  }}
                >
                  <CheckCircle2 size={14} /> Tandai Selesai
                </button>
                <button
                  type="button"
                  className="btn btn-ghost py-1.5 text-xs"
                  onClick={onEdit}
                >
                  <Pencil size={14} /> Ubah
                </button>
                <button
                  type="button"
                  className="btn btn-ghost py-1.5 text-xs"
                  onClick={() => s.setProjectStatus(project.id, "ditunda")}
                >
                  <PauseCircle size={14} /> Tunda
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-ghost py-1.5 text-xs"
                onClick={() => s.setProjectStatus(project.id, "aktif")}
              >
                <Undo2 size={14} /> Aktifkan Lagi
              </button>
            )}
          </div>

          <ConfirmButton
            className="btn btn-ghost py-1.5 text-xs text-coral"
            confirmText="Yakin hapus proyek?"
            onConfirm={() => s.deleteProject(project.id)}
          >
            <Trash2 size={14} /> Hapus
          </ConfirmButton>
        </div>
      </div>
    </article>
  );
};

const ProjectModal = ({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Project | null;
}) => {
  const { saveProject, toast } = useStore();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Kerja");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [icon, setIcon] = useState("🚀");
  const [color, setColor] = useState<Tint>("sky");
  const [initialTasks, setInitialTasks] = useState<string[]>(["", "", ""]);

  const resetOrPopulate = () => {
    if (initial) {
      setName(initial.name);
      setCategory(initial.category || "Kerja");
      setDescription(initial.description || "");
      setDueDate(initial.due_date || "");
      setIcon(initial.icon || "🚀");
      setColor(initial.color || "sky");
      setInitialTasks(["", ""]);
    } else {
      setName("");
      setCategory("Kerja");
      setDescription("");
      setDueDate(ymd(addDays(startOfDay(new Date()), 14)));
      setIcon("🚀");
      setColor("sky");
      setInitialTasks(["", "", ""]);
    }
  };

  // Sync state when modal opens
  useMemo(() => {
    if (open) resetOrPopulate();
  }, [open, initial]); // eslint-disable-line

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveProject(
      {
        ...(initial?.id ? { id: initial.id } : {}),
        name: name.trim(),
        category,
        description: description.trim(),
        due_date: dueDate || undefined,
        icon,
        color,
      },
      initial ? undefined : initialTasks
    );
    toast(initial ? "Proyek berhasil diperbarui." : "Proyek baru berhasil dibuat! 🚀");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide={!initial}
      title={initial ? "Ubah Proyek" : "Buat Proyek Baru"}
      desc="Kelola proyek dan pecah menjadi daftar task yang terukur."
    >
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="pm-name">
              Nama Proyek
            </label>
            <input
              id="pm-name"
              autoFocus
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Buat Web Portofolio, Redesign Aplikasi"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="pm-cat">
                Kategori
              </label>
              <select
                id="pm-cat"
                className="field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="pm-due">
                Target Selesai
              </label>
              <input
                id="pm-due"
                type="date"
                className="field"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="pm-desc">
              Deskripsi / Catatan Proyek
            </label>
            <textarea
              id="pm-desc"
              rows={2}
              className="field resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Target hasil akhir atau catatan penting proyek ini"
            />
          </div>

          <div>
            <span className="label">Ikon & Warna Kartu</span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {PROJECT_ICONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-[10px] border text-base transition",
                    icon === e
                      ? "border-ink bg-surface2 scale-105"
                      : "border-line hover:border-ink2"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {TINTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-label={`Warna ${t}`}
                  onClick={() => setColor(t)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition hover:scale-110",
                    tintBg[t],
                    color === t
                      ? "border-ink scale-110 shadow-sm ring-2 ring-brand/30"
                      : "border-transparent"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {!initial && (
          <div className="rounded-[18px] bg-surface2 p-4">
            <div className="flex items-center gap-1.5">
              <Sparkles size={15} className="text-brand" />
              <span className="label mb-0">Daftar Task Awal</span>
            </div>
            <p className="mt-1 mb-3 text-xs text-mute">
              Tuliskan task-task yang perlu dikerjakan untuk menyelesaikan proyek ini. Kamu bisa menambahkannya lagi nanti.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {initialTasks.map((task, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface text-[11px] font-bold text-mute">
                    {idx + 1}
                  </span>
                  <input
                    className="field py-2 text-sm"
                    value={task}
                    placeholder={`Task ${idx + 1} (misal: Desain UI, Setup Database)`}
                    onChange={(e) =>
                      setInitialTasks(
                        initialTasks.map((x, j) => (j === idx ? e.target.value : x))
                      )
                    }
                  />
                  {initialTasks.length > 1 && (
                    <button
                      type="button"
                      aria-label="Hapus baris task"
                      className="text-mute hover:text-coral"
                      onClick={() =>
                        setInitialTasks(initialTasks.filter((_, j) => j !== idx))
                      }
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand"
              onClick={() => setInitialTasks([...initialTasks, ""])}
            >
              <Plus size={14} /> Tambah baris task
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2 sm:col-span-2 pt-2 border-t border-line">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary">
            <ArrowUpRight size={16} /> Simpan Proyek
          </button>
        </div>
      </form>
    </Modal>
  );
};
