-- A lab login can read the equipment names on its own machines, and nothing else in the catalog.

create policy equipment_types_select_customer on public.equipment_types
for select to authenticated
using (
  public.current_user_role() = 'customer'
  and exists (
    select 1
    from public.units
    where units.equipment_type_id = equipment_types.id
      and units.customer_id = (select public.current_customer_id())
      and units.tenant_id = equipment_types.tenant_id
  )
);
