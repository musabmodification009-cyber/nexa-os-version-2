# Database Schema Reference

## Entity Relationships

```
auth.users ──┬── profiles (1:1)
             ├── user_roles (1:N)
             ├── notifications (1:N)
             ├── stock_movements.performed_by
             ├── purchase_orders.created_by
             └── inventory_requests.requested_by / reviewed_by

categories ──┬── categories.parent_id (self-ref)
             ├── items.category_id
             └── custom_field_definitions.category_id

suppliers ───┬── items.preferred_supplier_id
             └── purchase_orders.supplier_id

locations ───┬── locations.parent_id (self-ref)
             ├── items.location_id
             └── stock_movements.from_location_id / to_location_id

items ───────┬── stock_movements.item_id
             ├── purchase_order_items.item_id
             └── request_items.item_id

purchase_orders ── purchase_order_items (1:N, CASCADE)
inventory_requests ── request_items (1:N, CASCADE)
```

## Tables

### profiles
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | FK → auth.users ON DELETE CASCADE |
| full_name | text | |
| avatar_url | text | |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL, auto-trigger |

**RLS:** Users read/update own. Admins read all.

### user_roles
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| user_id | uuid | FK → auth.users CASCADE, NOT NULL |
| role | app_role | NOT NULL (admin/manager/requestor) |

**Unique:** (user_id, role). **RLS:** All authenticated read. Admins write.

### categories
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| name | text | NOT NULL |
| parent_id | uuid | FK → categories ON DELETE SET NULL |
| description | text | |
| created_at | timestamptz | NOT NULL DEFAULT now() |

**Index:** parent_id. **RLS:** All authenticated read. Admins write.

### suppliers
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| name | text | NOT NULL |
| contact_person | text | |
| email | text | |
| phone | text | |
| address | text | |
| notes | text | |
| payment_terms | text | |
| lead_time_days | integer | |
| min_order_qty | integer | |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL, auto-trigger |

**Index:** name. **RLS:** All authenticated read. Admin + manager write.

### locations
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| name | text | NOT NULL |
| parent_id | uuid | FK → locations ON DELETE SET NULL |
| description | text | |
| created_at | timestamptz | NOT NULL DEFAULT now() |

**Index:** parent_id. **RLS:** All authenticated read. Admins write.

### items
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| name | text | NOT NULL |
| description | text | |
| image_url | text | |
| sku | text | UNIQUE NOT NULL |
| barcode | text | |
| category_id | uuid | FK → categories ON DELETE SET NULL |
| tags | text[] | DEFAULT '{}' |
| unit_of_measure | text | DEFAULT 'each' |
| quantity_on_hand | integer | NOT NULL DEFAULT 0 |
| reorder_threshold | integer | NOT NULL DEFAULT 10 |
| reorder_quantity | integer | NOT NULL DEFAULT 20 |
| preferred_supplier_id | uuid | FK → suppliers ON DELETE SET NULL |
| cost_per_unit | numeric(10,2) | |
| sale_price | numeric(10,2) | |
| location_id | uuid | FK → locations ON DELETE SET NULL |
| status | text | CHECK (active/discontinued/archived) |
| custom_fields | jsonb | NOT NULL DEFAULT '{}' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL, auto-trigger |

**Indexes:** sku, barcode, category_id, preferred_supplier_id, location_id, status. **RLS:** All authenticated read. Admin + manager write.

### stock_movements
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| item_id | uuid | FK → items CASCADE, NOT NULL |
| quantity | integer | NOT NULL |
| direction | text | CHECK (in/out), NOT NULL |
| movement_type | text | CHECK (received/shipped/adjusted/transferred), NOT NULL |
| reference_note | text | |
| performed_by | uuid | FK → auth.users ON DELETE SET NULL |
| from_location_id | uuid | FK → locations ON DELETE SET NULL |
| to_location_id | uuid | FK → locations ON DELETE SET NULL |
| resulting_quantity | integer | NOT NULL |
| created_at | timestamptz | NOT NULL DEFAULT now() |

**Indexes:** item_id, created_at, movement_type, performed_by. **RLS:** All authenticated read. Admin + manager INSERT only. **Immutable** — no UPDATE/DELETE.

### purchase_orders
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| supplier_id | uuid | FK → suppliers RESTRICT, NOT NULL |
| status | text | CHECK (draft/submitted/partial/received/cancelled) |
| expected_delivery_date | date | |
| notes | text | |
| created_by | uuid | FK → auth.users ON DELETE SET NULL |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL, auto-trigger |

**Indexes:** supplier_id, status, created_by. **RLS:** All authenticated read. Admin + manager write.

### purchase_order_items
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| purchase_order_id | uuid | FK → purchase_orders CASCADE, NOT NULL |
| item_id | uuid | FK → items RESTRICT, NOT NULL |
| quantity_ordered | integer | NOT NULL |
| quantity_received | integer | DEFAULT 0 |
| unit_cost | numeric(10,2) | |

**Indexes:** purchase_order_id, item_id. **RLS:** All authenticated read. Admin + manager write.

### inventory_requests
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| requested_by | uuid | FK → auth.users CASCADE, NOT NULL |
| status | text | CHECK (pending/approved/fulfilled/declined) |
| reason | text | |
| project_reference | text | |
| reviewed_by | uuid | FK → auth.users ON DELETE SET NULL |
| reviewed_at | timestamptz | |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL, auto-trigger |

**Indexes:** requested_by, status. **RLS:** Requestors read/insert own. Admin + manager read all + update.

### request_items
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| request_id | uuid | FK → inventory_requests CASCADE, NOT NULL |
| item_id | uuid | FK → items RESTRICT, NOT NULL |
| quantity | integer | NOT NULL |

**Indexes:** request_id, item_id. **RLS:** Follows parent request visibility.

### custom_field_definitions
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| name | text | NOT NULL |
| field_type | text | CHECK (text/number/date/boolean/select), NOT NULL |
| options | jsonb | For select-type fields |
| category_id | uuid | FK → categories ON DELETE SET NULL (null = global) |
| is_required | boolean | DEFAULT false |
| created_at | timestamptz | NOT NULL DEFAULT now() |

**RLS:** All authenticated read. Admins write.

### notifications
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| user_id | uuid | FK → auth.users CASCADE, NOT NULL |
| type | text | NOT NULL |
| title | text | NOT NULL |
| message | text | |
| is_read | boolean | DEFAULT false |
| reference_id | uuid | Generic entity pointer |
| reference_type | text | (item/purchase_order/request) |
| created_at | timestamptz | NOT NULL DEFAULT now() |

**Index:** (user_id, is_read). **RLS:** Users read/update own only.

## Security Functions

- **has_role(uuid, app_role)** — SECURITY DEFINER, checks user_roles table
- **handle_new_user()** — SECURITY DEFINER trigger, auto-creates profile on signup
- **update_updated_at_column()** — Sets updated_at = now() on UPDATE
