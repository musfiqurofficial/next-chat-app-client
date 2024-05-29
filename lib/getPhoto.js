export default async function getPhoto(id) {
  const result = await fetch(
    `https://jsonplaceholder.typicode.com/photos/${id}`
  );

  if (!result.ok) {
    throw new Error("Failed to fetch photo");
  }

  return result.json();
}
