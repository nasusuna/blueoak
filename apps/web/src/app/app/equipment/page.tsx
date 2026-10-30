import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { isStaff, loadWorkspace, redirectUnlessStaff } from "@/lib/session";
import { EquipmentForm } from "./equipment-form";

const categoryLabel: Record<string, string> = {
  biochemistry: "Biochemistry",
  hematology: "Hematology",
  electrolyte: "Electrolyte",
  immunoassay: "Immunoassay",
  coagulation: "Coagulation",
  poct: "POCT",
  "lab equipment": "Lab equipment",
};

const labelFor = (category: string | null) => (category ? (categoryLabel[category] ?? category) : "—");

const EquipmentPage = async () => {
  const { supabase, profile } = await loadWorkspace();

  if (profile?.role === "customer") {
    redirectUnlessStaff(profile.role);
  }

  if (!profile || !isStaff(profile.role)) {
    return <p className="text-base text-muted-foreground">Equipment types are managed by the business owner and technicians.</p>;
  }

  const { data: equipmentTypes } = await supabase.from("equipment_types").select("id, name, category").order("category").order("name");
  const rows = equipmentTypes ?? [];

  return (
    <>
      <PageHeader title="Equipment" description="Choose a category, then the machine name, and save it to the master list." />
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Add an equipment type</h2>
        </CardHeader>
        <CardContent>
          <EquipmentForm equipment={rows} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold tracking-tight">Master list</h2>
        </CardHeader>
        <CardContent>
          {rows.length > 0 ? (
            <table className="data-table w-full text-left text-base">
              <caption className="sr-only">Equipment types</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Category
                  </th>
                  <th scope="col" className="py-3 font-medium">
                    Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">{labelFor(item.category)}</td>
                    <td className="py-3 font-medium">{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-base text-muted-foreground">No equipment types yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default EquipmentPage;
