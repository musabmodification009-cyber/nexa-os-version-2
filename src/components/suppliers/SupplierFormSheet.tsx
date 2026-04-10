import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCreateSupplier, useUpdateSupplier } from "@/hooks/useInventoryMutations";
import type { Supplier } from "@/types/inventory";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string(),
  email: z.string().email("Invalid email").or(z.literal("")),
  phone: z.string(),
  address: z.string(),
  notes: z.string(),
  paymentTerms: z.string(),
  leadTimeDays: z.coerce.number().int().min(0, "Must be 0 or more"),
  minOrderQuantity: z.coerce.number().int().min(0, "Must be 0 or more"),
});

type FormValues = z.infer<typeof schema>;

interface SupplierFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
}

export function SupplierFormSheet({ open, onOpenChange, supplier }: SupplierFormSheetProps) {
  const isEdit = !!supplier;
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      paymentTerms: "",
      leadTimeDays: 0,
      minOrderQuantity: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (supplier) {
        form.reset({
          name: supplier.name,
          contactName: supplier.contactName ?? "",
          email: supplier.email ?? "",
          phone: supplier.phone ?? "",
          address: supplier.address ?? "",
          notes: supplier.notes ?? "",
          paymentTerms: "",
          leadTimeDays: supplier.leadTimeDays ?? 0,
          minOrderQuantity: 0,
        });
      } else {
        form.reset();
      }
    }
  }, [open, supplier, form]);

  function onSubmit(values: FormValues) {
    const now = new Date().toISOString();

    if (isEdit && supplier) {
      updateSupplier.mutate(
        {
          id: supplier.id,
          updates: {
            name: values.name,
            contactName: values.contactName ?? "",
            email: values.email ?? "",
            phone: values.phone ?? "",
            address: values.address ?? "",
            notes: values.notes ?? "",
            leadTimeDays: values.leadTimeDays ?? 0,
            updatedAt: now,
          },
        },
        {
          onSuccess: () => {
            toast.success("Supplier updated");
            onOpenChange(false);
          },
          onError: (e) => toast.error(e.message || "Failed to update supplier."),
        },
      );
    } else {
      const newSupplier: Supplier = {
        id: crypto.randomUUID(),
        name: values.name,
        contactName: values.contactName ?? "",
        email: values.email ?? "",
        phone: values.phone ?? "",
        address: values.address ?? "",
        notes: values.notes ?? "",
        leadTimeDays: values.leadTimeDays ?? 0,
        rating: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      createSupplier.mutate(newSupplier, {
        onSuccess: () => {
          toast.success("Supplier created");
          onOpenChange(false);
        },
        onError: (e) => toast.error(e.message || "Failed to create supplier."),
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Supplier" : "New Supplier"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Update supplier details." : "Add a new supplier to the directory."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input {...field} placeholder="Supplier name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl><Input {...field} placeholder="Contact name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} placeholder="email@example.com" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} placeholder="+1 555 000 0000" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Textarea {...field} rows={2} placeholder="Street, City, State" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="leadTimeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Time (days)</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minOrderQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Order Qty</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <FormControl><Input {...field} placeholder="Net 30, COD, etc." /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea {...field} rows={3} placeholder="Additional notes…" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{isEdit ? "Save Changes" : "Create Supplier"}</Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
