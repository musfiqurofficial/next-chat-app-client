export default async function getChatUser(username) {
  const result = await fetch(`http://localhost:5000/chatUsers/${username}`);

  if (!result.ok) {
    throw new Error("Failed to fetch");
  }

  return result.json();
}
