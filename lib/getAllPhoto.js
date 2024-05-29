export default async function getAllPhoto() {
  const result = await fetch(
    "https://jsonplaceholder.typicode.com/photos?_limit=10"
  );

  if (!result.ok) {
    throw new Error("Failed to fetch photos");
  }

  return result.json();
}
