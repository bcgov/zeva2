export const LatestActivity = async () => {
  const wait = await new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, 5000);
  });
  return <p>Latest activity goes here</p>;
};
