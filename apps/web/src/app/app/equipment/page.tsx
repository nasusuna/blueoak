import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isStaff, loadWorkspace } from "@/lib/session";
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

  if (!profile || !isStaff(profile.role)) {
    return <p className="text-base text-muted-foreground">Equipment types are managed by the business owner and technicians.</p>;
  }

  const { data: equipmentTypes } = await supabase.from("equipment_types").select("id, name, category").order("name");
  const rows = equipmentTypes ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold">Equipment</h1>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Add an equipment type</h2>
        </CardHeader>
        <CardContent>
          <EquipmentForm equipment={rows} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Master list</h2>
        </CardHeader>
        <CardContent>
          {rows.length > 0 ? (
            <table className="w-full text-left text-base">
              <caption className="sr-only">Equipment types</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Name
                  </th>
                  <th scope="col" className="py-3 font-medium">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">{item.name}</td>
                    <td className="py-3">{labelFor(item.category)}</td>
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
