import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isStaff, loadWorkspace } from "@/lib/session";
import { EquipmentBrowser } from "./equipment-browser";
import { EquipmentForm } from "./equipment-form";

const EquipmentPage = async () => {
  const { supabase, profile } = await loadWorkspace();

  if (!profile || !isStaff(profile.role)) {
    return <p className="text-base text-muted-foreground">Equipment types are managed by the business owner and technicians.</p>;
  }

  const { data: equipmentTypes } = await supabase.from("equipment_types").select("id, name, category").order("name");

  return (
    <>
      <h1 className="text-2xl font-semibold">Equipment</h1>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Add an equipment type</h2>
        </CardHeader>
        <CardContent>
          <EquipmentForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Master list</h2>
        </CardHeader>
        <CardContent>
          {equipmentTypes && equipmentTypes.length > 0 ? (
            <EquipmentBrowser equipment={equipmentTypes} />
          ) : (
            <p className="text-base text-muted-foreground">No equipment types yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default EquipmentPage;
