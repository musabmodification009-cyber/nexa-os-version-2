import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocations } from "@/hooks/useLocations";
import { useCreateLocation, useUpdateLocation } from "@/hooks/useInventoryMutations";
import type { Location, LocationType } from "@/types/inventory";

const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: "warehouse", label: "Warehouse" },
  { value: "zone", label: "Zone" },
  { value: "aisle", label: "Aisle" },
  { value: "shelf", label: "Shelf" },
  { value: "bin", label: "Bin" },
];

const VALID_PARENTS: Record<LocationType, LocationType[]> = {
  warehouse: [],
  zone: ["warehouse"],
  aisle: ["zone"],
  shelf: ["aisle"],
  bin: ["shelf"],
};

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["warehouse", "zone", "aisle", "shelf", "bin"]),
  parentId: z.string().nullable(),
  description: z.string().max(500),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface LocationFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editLocation?: Location | null;
}

export function LocationFormSheet({ open, onOpenChange, editLocation }: LocationFormSheetProps) {
  const { data: allLocations } = useLocations();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const isEdit = !!editLocation;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "warehouse" as LocationType,
      parentId: null,
      description: "",
      isActive: true,
    },
  });

  const watchedType = form.watch("type");

  const validParents = useMemo(() => {
    const allowedParentTypes = VALID_PARENTS[watchedType] ?? [];
    if (allowedParentTypes.length === 0) return [];
    return allLocations.filter(
      (l) => allowedParentTypes.includes(l.type) && l.id !== editLocation?.id,
    );
  }, [watchedType, allLocations, editLocation?.id]);

  // Reset parentId when type changes and current parent is invalid
  useEffect(() => {
    const currentParent = form.getValues("parentId");
    if (currentParent && !validParents.find((p) => p.id === currentParent)) {
      form.setValue("parentId", null);
    }
  }, [validParents, form]);

  // Populate form when editing
  useEffect(() => {
    if (open && editLocation) {
      form.reset({
        name: editLocation.name,
        type: editLocation.type,
        parentId: editLocation.parentId,
        description: editLocation.description ?? "",
        isActive: editLocation.isActive,
      });
    } else if (open) {
      form.reset({
        name: "",
        type: "warehouse",
        parentId: null,
        description: "",
        isActive: true,
      });
    }
  }, [open, editLocation, form]);

  function onSubmit(values: FormValues) {
    if (isEdit && editLocation) {
      updateMutation.mutate(
        { id: editLocation.id, updates: { name: values.name, type: values.type, parentId: values.parentId, description: values.description, isActive: values.isActive } },
        {
          onSuccess: () => {
            toast.success("Location updated");
            onOpenChange(false);
          },
          onError: (e) => toast.error(e.message || "Failed to update location."),
        },
      );
    } else {
      const newLocation: Location = {
        id: `loc-${Date.now()}`,
        name: values.name,
        type: values.type,
        parentId: values.parentId,
        description: values.description ?? "",
        address: "",
        isActive: values.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      createMutation.mutate(newLocation, {
        onSuccess: () => {
          toast.success("Location created");
          onOpenChange(false);
        },
        onError: (e) => toast.error(e.message || "Failed to create location."),
      });
    }
  }

  const noParentAllowed = VALID_PARENTS[watchedType].length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Location" : "New Location"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Update location details." : "Add a new storage location."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main Warehouse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LOCATION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!noParentAllowed && (
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Location</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}
                      value={field.value ?? "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {validParents.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional description" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                  <FormLabel className="cursor-pointer">Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
                {isEdit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
