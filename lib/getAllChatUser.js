export default async function getAllChatUser() {
  const result = await fetch("http://localhost:5000/chatUsers");

  if (!result.ok) {
    throw new Error("Failed to fetch");
  }

  return result.json();
}
