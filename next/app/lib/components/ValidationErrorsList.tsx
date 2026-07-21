import { ValidationError } from "@/app/lib/utils/actionResponse";

export const ValidationErrorsList = ({
  errors,
  heading,
}: {
  errors: ValidationError[];
  heading?: string;
}) => {
  if (errors.length === 0) return null;
  return (
    <div className="border border-red-300 rounded p-4 bg-red-50">
      <p className="font-semibold text-red-700 mb-2">
        {heading ?? "The following errors must be resolved:"}
      </p>
      <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
        {errors.map((err, i) => (
          <li key={i}>
            <span className="font-medium">{err.errorType}</span>
            {err.record && (
              <span className="text-red-600"> — {err.record}</span>
            )}
            {err.details && (
              <span className="text-red-500">: {err.details}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
