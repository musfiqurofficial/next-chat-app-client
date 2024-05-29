export default async function getAllPhoto() {
  const result = await fetch("ttp://localhost:5000/images");

  if (!result.ok) {
    throw new Error("Failed to fetch photos");
  }

  return result.json();
}
