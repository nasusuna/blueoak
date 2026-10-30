import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isStaff, loadWorkspace } from "@/lib/session";
import { ChemicalBrowser } from "./chemical-browser";
import { ChemicalForm } from "./chemical-form";

const ChemicalsPage = async () => {
  const { supabase, profile } = await loadWorkspace();

  if (!profile || !isStaff(profile.role)) {
    return <p className="text-base text-muted-foreground">Chemicals are managed by the business owner and technicians.</p>;
  }

  const { data: chemicals } = await supabase.from("chemicals").select("id, name, category").order("name");

  return (
    <>
      <h1 className="text-2xl font-semibold">Chemicals</h1>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Add a chemical</h2>
        </CardHeader>
        <CardContent>
          <ChemicalForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Master list</h2>
        </CardHeader>
        <CardContent>
          {chemicals && chemicals.length > 0 ? (
            <ChemicalBrowser chemicals={chemicals} />
          ) : (
            <p className="text-base text-muted-foreground">No chemicals yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ChemicalsPage;
