import type { ChemicalCategory } from "@service-app/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isStaff, loadWorkspace } from "@/lib/session";
import { ChemicalForm } from "./chemical-form";

const categoryLabel: Record<ChemicalCategory, string> = {
  reagents: "Reagents",
  biochemistry: "Biochemistry",
  hematology: "Hematology",
  rapid_cards: "Rapid cards",
  consumables: "Consumables",
};

const ChemicalsPage = async () => {
  const { supabase, profile } = await loadWorkspace();

  if (!profile || !isStaff(profile.role)) {
    return <p className="text-base text-muted-foreground">Chemicals are managed by the business owner and technicians.</p>;
  }

  const { data: chemicals } = await supabase.from("chemicals").select("id, name, category").order("category").order("name");
  const rows = chemicals ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold">Chemicals</h1>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Add a chemical</h2>
        </CardHeader>
        <CardContent>
          <ChemicalForm chemicals={rows} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Master list</h2>
        </CardHeader>
        <CardContent>
          {rows.length > 0 ? (
            <table className="w-full text-left text-base">
              <caption className="sr-only">Chemicals</caption>
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
                    <td className="py-3 pr-4">{categoryLabel[item.category]}</td>
                    <td className="py-3">{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-base text-muted-foreground">No chemicals yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ChemicalsPage;
