// ==UserScript==
// @name         osu! Mass DM
// @version      1.0.0
// @description  yes
// @author       Yuuto
// @match        https://osu.ppy.sh/rankings/*/performance*
// @match        https://osu.ppy.sh/rankings/*/score
// @icon         https://www.google.com/s2/favicons?sz=64&domain=osu.ppy.sh
// @grant        none
// ==/UserScript==

const getChannelId = async (userId) => {
  const page = await fetch(
    `https://osu.ppy.sh/community/chat?sendto=${userId}`
  ).then((res) => res.text());
  const html = new DOMParser().parseFromString(page, "text/html");
  const json = JSON.parse(
    html.querySelector("script#json-chat-initial").textContent
  );
  const presence = json.presence;
  const channelId = presence.find(
    (p) => p.type === "PM" && p.users[0] === parseInt(userId)
  );
  return channelId.channel_id;
};

const sendDm = async (id, message) => {
  const channelId = await getChannelId(id);
  fetch(`https://osu.ppy.sh/community/chat/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      "X-CSRF-Token": window.csrf,
    },
    body: new URLSearchParams({
      is_action: "false",
      message,
      target_id: id,
      target_type: "channel",
      uuid: crypto.randomUUID(),
    }),
  });
};

const createMassDmButton = (count) => {
  const button = document.createElement("button");
  button.textContent = `Mass DM ${count} user${count > 1 ? "s" : ""}`;
  button.classList.add("btn-osu-big");
  button.addEventListener("click", async () => {
    const message = prompt("Message to send:");
    if (!message) return alert("Mass DM cancelled");
    const users = document.querySelectorAll("[data-user-id]");
    for (const user of users) {
      const id = user.getAttribute("data-user-id");
      console.log(id, message);
      await sendDm(id, message);
    }
  });
  return button;
};

if (location.pathname.match(/\/rankings\/[a-z]+\/[performance|score]/g)) {
  const gridItem = document.createElement("div");
  gridItem.classList.add("u-contents");
  const content = document.createElement("div");
  content.classList.add("ranking-filter");
  const title = document.createElement("div");
  title.classList.add("ranking-filter__title");
  title.textContent = "Mass DM";
  content.appendChild(title);
  content.appendChild(
    createMassDmButton(document.querySelectorAll("[data-user-id]").length)
  );
  gridItem.appendChild(content);
  document
    .querySelector(".osu-page.osu-page--ranking-info .grid-items")
    .appendChild(gridItem);
}
