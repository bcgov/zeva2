import { Upload } from "../lib/components/Upload";

const Page = async () => {
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Upload an ICBC File</h1>
      <Upload />
    </div>
  );
};

export default Page;
