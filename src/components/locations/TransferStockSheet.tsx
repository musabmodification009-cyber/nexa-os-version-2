import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRightLeft } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useItems, useLocations } from "@/hooks/useInventoryData";
import { useCreateMovement } from "@/hooks/useInventoryMutations";
import { MovementType } from "@/types/inventory";
import type { Item } from "@/types/inventory";

const schema = z.object({
  itemId: z.string().min(1, "Select an item"),
  fromLocationId: z.string().min(1, "Select source location"),
  toLocationId: z.string().min(1, "Select destination location"),
  quantity: z.coerce.number().int().min(1, "Minimum 1"),
});

type FormValues = z.infer<typeof schema>;

interface TransferStockSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedItemId?: string;
}

export function TransferStockSheet({
  open,
  onOpenChange,
  preselectedItemId,
}: TransferStockSheetProps) {
  const { data: items } = useItems();
  const { data: locations } = useLocations();
  const createMovement = useCreateMovement();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      itemId: preselectedItemId ?? "",
      fromLocationId: "",
      toLocationId: "",
      quantity: 1,
    },
  });

  const selectedItemId = form.watch("itemId");
  const fromLocationId = form.watch("fromLocationId");

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId),
    [items, selectedItemId],
  );

  // Items that have a location assigned
  const assignedItems = useMemo(
    () => items.filter((i) => i.locationId),
    [items],
  );

  const maxQty = selectedItem?.currentStock ?? 0;

  function onSubmit(values: FormValues) {
    if (values.fromLocationId === values.toLocationId) {
      form.setError("toLocationId", {
        message: "Destination must differ from source",
      });
      return;
    }

    if (values.quantity > maxQty) {
      form.setError("quantity", {
        message: `Only ${maxQty} available`,
      });
      return;
    }

    const fromLoc = locations.find((l) => l.id === values.fromLocationId);
    const toLoc = locations.find((l) => l.id === values.toLocationId);

    createMovement.mutate(
      {
        id: crypto.randomUUID(),
        itemId: values.itemId,
        type: MovementType.Transferred,
        quantity: values.quantity,
        fromLocationId: values.fromLocationId,
        toLocationId: values.toLocationId,
        reference: `Transfer: ${fromLoc?.name ?? ""} → ${toLoc?.name ?? ""}`,
        notes: "",
        performedBy: "demo-user",
        createdAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          toast.success("Stock transferred successfully");
          form.reset();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transfer Stock
          </SheetTitle>
          <SheetDescription>
            Move inventory between locations
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-5"
          >
            {/* Item */}
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      // Auto-fill from location
                      const item = items.find((i) => i.id === v);
                      if (item?.locationId) {
                        form.setValue("fromLocationId", item.locationId);
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assignedItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* From Location */}
            <FormField
              control={form.control}
              name="fromLocationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Location</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Source location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map((loc) => (
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

            {/* To Location */}
            <FormField
              control={form.control}
              name="toLocationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Location</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Destination location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations
                        .filter((l) => l.id !== fromLocationId)
                        .map((loc) => (
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

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Quantity
                    {selectedItem && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        (max {maxQty})
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={maxQty}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={createMovement.isLoading}
            >
              {createMovement.isLoading ? "Transferring…" : "Transfer Stock"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
