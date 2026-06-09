"use client";

/**
 * ModifierGroupsEditor — inline editor for a menu item's modifier groups.
 *
 * Used inside the cafe-admin/menu Add/Edit Product dialog. Restaurants need
 * these for size, doneness, add-ons, etc. The schema (MenuItemOption +
 * MenuItemOptionValue) and the admin CRUD endpoints already exist —
 * this is the operator-facing UI.
 *
 * Behavior:
 *  - If menuItemId is null (product not saved yet), shows a helpful hint
 *    that the product must be saved first.
 *  - Otherwise, loads option groups + their values via
 *    GET /api/menu/items/[id]/options and lets the operator add / edit /
 *    delete groups and choices.
 *  - Each group is edited inline and persisted via its own "Save" button so
 *    the rest of the product form isn't blocked by modifier validation.
 *  - All write calls send the JWT in the Authorization header.
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Trash2, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type OptionValue = {
  id: string | null; // null = unsaved draft
  valueName: string;
  extraPrice: number;
  sortOrder?: number;
};

type OptionGroup = {
  id: string | null; // null = unsaved draft
  name: string;
  type: "single" | "multi";
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  values: OptionValue[];
  isDirty?: boolean; // local edit not yet persisted
  isSaving?: boolean;
};

function authHeaders(json = true): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const h: Record<string, string> = json ? { "Content-Type": "application/json" } : {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

interface ModifierGroupsEditorProps {
  menuItemId: string | null;
  isArabic?: boolean;
}

export function ModifierGroupsEditor({ menuItemId, isArabic }: ModifierGroupsEditorProps) {
  const { toast } = useToast();
  const t = useCallback((en: string, ar: string) => (isArabic ? ar : en), [isArabic]);

  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!menuItemId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/menu/items/${menuItemId}/options`, {
        headers: authHeaders(false),
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setGroups(
          json.data.map((g: any) => ({
            id: String(g.id),
            name: g.name || "",
            type: g.type === "multi" ? "multi" : "single",
            isRequired: !!g.isRequired,
            minSelect: Number(g.minSelect ?? 0),
            maxSelect: Number(g.maxSelect ?? 1),
            values: Array.isArray(g.values)
              ? g.values.map((v: any) => ({
                  id: String(v.id),
                  valueName: v.valueName || "",
                  extraPrice: Number(v.extraPrice ?? 0),
                  sortOrder: Number(v.sortOrder ?? 0),
                }))
              : [],
          }))
        );
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, [menuItemId]);

  useEffect(() => {
    if (menuItemId) void refetch();
    else setGroups([]);
  }, [menuItemId, refetch]);

  // --- Group helpers ---
  const addGroupDraft = () => {
    setGroups((g) => [
      ...g,
      {
        id: null,
        name: "",
        type: "single",
        isRequired: false,
        minSelect: 0,
        maxSelect: 1,
        values: [],
        isDirty: true,
      },
    ]);
  };

  const updateGroup = (idx: number, patch: Partial<OptionGroup>) => {
    setGroups((g) => g.map((row, i) => (i === idx ? { ...row, ...patch, isDirty: true } : row)));
  };

  const removeGroup = async (idx: number) => {
    const grp = groups[idx];
    if (grp.id) {
      if (!confirm(t("Delete this modifier group?", "هل تريد حذف هذه المجموعة؟"))) return;
      try {
        const res = await fetch(`/api/menu/options/${grp.id}`, {
          method: "DELETE",
          headers: authHeaders(false),
        });
        if (!res.ok) throw new Error("delete failed");
      } catch {
        toast({ title: t("Delete failed", "فشل الحذف"), variant: "destructive" });
        return;
      }
    }
    setGroups((g) => g.filter((_, i) => i !== idx));
  };

  const saveGroup = async (idx: number) => {
    if (!menuItemId) return;
    const grp = groups[idx];
    if (!grp.name.trim()) {
      toast({ title: t("Group needs a name", "اسم المجموعة مطلوب"), variant: "destructive" });
      return;
    }
    setGroups((g) => g.map((row, i) => (i === idx ? { ...row, isSaving: true } : row)));
    try {
      const payload = {
        name: grp.name,
        type: grp.type,
        isRequired: grp.isRequired,
        minSelect: grp.minSelect,
        maxSelect: grp.maxSelect,
      };
      let groupId = grp.id;
      if (groupId === null) {
        // Create the group with its current values in one request.
        const res = await fetch(`/api/menu/items/${menuItemId}/options`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            ...payload,
            values: grp.values.filter((v) => v.valueName.trim()),
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "save failed");
        groupId = String(json.data.id);
      } else {
        // Update the group metadata. Values are managed via their own endpoints.
        const res = await fetch(`/api/menu/options/${groupId}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "save failed");
      }
      toast({ title: t("Group saved", "تم حفظ المجموعة") });
      await refetch();
    } catch (err: any) {
      toast({ title: t("Save failed", "فشل الحفظ"), description: err?.message, variant: "destructive" });
    } finally {
      setGroups((g) => g.map((row, i) => (i === idx ? { ...row, isSaving: false } : row)));
    }
  };

  // --- Value helpers ---
  const addValueDraft = (groupIdx: number) => {
    setGroups((g) =>
      g.map((row, i) =>
        i === groupIdx
          ? {
              ...row,
              values: [...row.values, { id: null, valueName: "", extraPrice: 0 }],
              isDirty: true,
            }
          : row
      )
    );
  };

  const updateValue = (groupIdx: number, valIdx: number, patch: Partial<OptionValue>) => {
    setGroups((g) =>
      g.map((row, i) =>
        i === groupIdx
          ? {
              ...row,
              values: row.values.map((v, j) => (j === valIdx ? { ...v, ...patch } : v)),
              isDirty: true,
            }
          : row
      )
    );
  };

  const removeValue = async (groupIdx: number, valIdx: number) => {
    const grp = groups[groupIdx];
    const val = grp.values[valIdx];
    if (val.id) {
      try {
        const res = await fetch(`/api/menu/option-values/${val.id}`, {
          method: "DELETE",
          headers: authHeaders(false),
        });
        if (!res.ok) throw new Error("delete failed");
      } catch {
        toast({ title: t("Delete failed", "فشل الحذف"), variant: "destructive" });
        return;
      }
    }
    setGroups((g) =>
      g.map((row, i) =>
        i === groupIdx ? { ...row, values: row.values.filter((_, j) => j !== valIdx) } : row
      )
    );
  };

  const saveValue = async (groupIdx: number, valIdx: number) => {
    const grp = groups[groupIdx];
    const val = grp.values[valIdx];
    if (!grp.id) {
      toast({ title: t("Save the group first", "احفظ المجموعة أولاً"), variant: "destructive" });
      return;
    }
    if (!val.valueName.trim()) {
      toast({ title: t("Choice needs a name", "اسم الخيار مطلوب"), variant: "destructive" });
      return;
    }
    try {
      if (val.id === null) {
        const res = await fetch(`/api/menu/options/${grp.id}/values`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ valueName: val.valueName, extraPrice: val.extraPrice }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "save failed");
      } else {
        const res = await fetch(`/api/menu/option-values/${val.id}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ valueName: val.valueName, extraPrice: val.extraPrice }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "save failed");
      }
      toast({ title: t("Choice saved", "تم حفظ الخيار") });
      await refetch();
    } catch (err: any) {
      toast({ title: t("Save failed", "فشل الحفظ"), description: err?.message, variant: "destructive" });
    }
  };

  // --- Render ---
  if (!menuItemId) {
    return (
      <div className="space-y-2 bg-amber-50/50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200/50">
        <Label className="text-amber-700 dark:text-amber-400">
          {t("Add-ons / Modifiers", "الإضافات / التخصيصات")}
        </Label>
        <p className="text-xs text-muted-foreground">
          {t(
            "Save the product first, then reopen it to add size, doneness, or add-on options.",
            "احفظ المنتج أولاً، ثم افتحه من جديد لإضافة الأحجام والإضافات والتخصيصات."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
      <div className="flex items-center justify-between">
        <div>
          <Label>{t("Add-ons / Modifiers", "الإضافات / التخصيصات")}</Label>
          <p className="text-[10px] text-muted-foreground">
            {t("Sizes, cooking degree, add-ons, etc.", "الأحجام، طريقة الطبخ، الإضافات...")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addGroupDraft}>
          <Plus className="h-3 w-3 mr-1" /> {t("Add Group", "إضافة مجموعة")}
        </Button>
      </div>

      {isLoading && groups.length === 0 && (
        <p className="text-xs text-muted-foreground italic text-center py-2">
          <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
          {t("Loading...", "جاري التحميل...")}
        </p>
      )}

      {!isLoading && groups.length === 0 && (
        <p className="text-xs text-muted-foreground italic text-center py-2">
          {t("No modifiers yet. Add a group to let customers customize this item.", "لا توجد تخصيصات. أضف مجموعة لتتيح للعميل تخصيص المنتج.")}
        </p>
      )}

      {groups.map((grp, gi) => (
        <div
          key={grp.id ?? `draft-${gi}`}
          className="space-y-2 bg-background/80 p-3 rounded-lg border"
        >
          {/* Group header */}
          <div className="flex items-center gap-2">
            <Input
              placeholder={t("Group name (e.g. Size)", "اسم المجموعة (مثلاً: الحجم)")}
              value={grp.name}
              onChange={(e) => updateGroup(gi, { name: e.target.value })}
              className="h-8 text-sm flex-1"
            />
            <Select value={grp.type} onValueChange={(v) => updateGroup(gi, { type: v as "single" | "multi" })}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">{t("Single", "واحد فقط")}</SelectItem>
                <SelectItem value="multi">{t("Multi", "متعدد")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive shrink-0"
              onClick={() => removeGroup(gi)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Group settings */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Switch
                checked={grp.isRequired}
                onCheckedChange={(v) => updateGroup(gi, { isRequired: v, minSelect: v ? Math.max(1, grp.minSelect) : 0 })}
              />
              <span className="text-muted-foreground">{t("Required", "إلزامي")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">{t("Min", "أدنى")}</span>
              <Input
                type="number"
                value={grp.minSelect}
                onChange={(e) => updateGroup(gi, { minSelect: Number(e.target.value) || 0 })}
                className="h-7 w-14 text-xs"
                min={0}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">{t("Max", "أعلى")}</span>
              <Input
                type="number"
                value={grp.maxSelect}
                onChange={(e) => updateGroup(gi, { maxSelect: Number(e.target.value) || 1 })}
                className="h-7 w-14 text-xs"
                min={1}
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="ml-auto h-7 text-xs"
              onClick={() => saveGroup(gi)}
              disabled={grp.isSaving}
            >
              {grp.isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              {t("Save", "حفظ")}
            </Button>
          </div>

          {/* Values */}
          <div className="space-y-1 pl-3 border-l-2 border-muted">
            {grp.values.map((v, vi) => (
              <div key={v.id ?? `draft-${vi}`} className="flex items-center gap-2">
                <Input
                  placeholder={t("Choice (e.g. Large)", "خيار (مثلاً: كبير)")}
                  value={v.valueName}
                  onChange={(e) => updateValue(gi, vi, { valueName: e.target.value })}
                  className="h-7 text-xs flex-1"
                />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">+</span>
                  <Input
                    type="number"
                    step="0.100"
                    value={v.extraPrice}
                    onChange={(e) => updateValue(gi, vi, { extraPrice: Number(e.target.value) || 0 })}
                    className="h-7 text-xs w-20"
                  />
                  <span className="text-[10px] text-muted-foreground">OMR</span>
                </div>
                {grp.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-emerald-600 shrink-0"
                    onClick={() => saveValue(gi, vi)}
                    title={t("Save choice", "حفظ الخيار")}
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive shrink-0"
                  onClick={() => removeValue(gi, vi)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => addValueDraft(gi)}
            >
              <Plus className="h-3 w-3 mr-1" /> {t("Add choice", "إضافة خيار")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
