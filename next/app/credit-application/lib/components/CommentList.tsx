import { prisma } from "@/lib/prisma";

export const CommentList = async ({ creditApplicationId }: { creditApplicationId: number }) => {
  const histories = await prisma.creditApplicationHistory.findMany({
    where: {
      creditApplicationId,
      NOT: { comment: null },
    },
    select: {
      id: true,
      comment: true,
      timestamp: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  if (!histories.length) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Comments</h2>
      <ul className="space-y-4">
        {histories.map((entry) => (
          <li key={entry.id} className="border-b pb-2">
            <p className="text-sm text-gray-600">
              {entry.timestamp.toLocaleString()} – {entry.user.firstName} {entry.user.lastName}
            </p>
            <p className="text-base">{entry.comment}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
