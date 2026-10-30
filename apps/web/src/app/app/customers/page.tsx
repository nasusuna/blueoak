import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
import { isStaff, loadWorkspace } from "@/lib/session";
import { AddCustomer } from "./customer-form";

const CustomersPage = async () => {
  const { supabase, profile } = await loadWorkspace();

  if (!profile || !isStaff(profile.role)) {
    return <p className="text-base text-muted-foreground">Customers are managed by the business owner and technicians.</p>;
  }

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, city, mobile, contact_person")
    .order("name");

  return (
    <>
      <PageHeader title="Customers" description="Labs and hospitals this business services." />
      <Card>
        <CardContent className="pt-6">
          {customers && customers.length > 0 ? (
            <table className="data-table w-full text-left text-base">
              <caption className="sr-only">Customers in this business</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-3 pr-4 font-medium">Name</th>
                  <th scope="col" className="py-3 pr-4 font-medium">City</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Mobile</th>
                  <th scope="col" className="py-3 font-medium">Contact</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">
                      <TextLink href={`/app/customers/${customer.id}`}>{customer.name}</TextLink>
                    </td>
                    <td className="py-3 pr-4">{customer.city ?? "—"}</td>
                    <td className="py-3 pr-4">{customer.mobile ?? "—"}</td>
                    <td className="py-3">{customer.contact_person ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-base text-muted-foreground">No customers yet.</p>
          )}
        </CardContent>
      </Card>
      <AddCustomer />
    </>
  );
};

export default CustomersPage;
