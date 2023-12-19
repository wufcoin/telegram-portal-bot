const { Api, TelegramClient } = require("telegram");
const { StoreSession } = require("telegram/sessions");
// const { NewMessage, NewMessageEvent } = require('telegram/tl');
const input = require("input");
const { NewMessage } = require("telegram/events");
const { EditedMessage } = require("telegram/events/EditedMessage");

const apiId = 14908730;
const apiHash = "3e22e50a7efbac3e6738f6f2b62f3b39";
let storeSession = new StoreSession("authKey");; // fill this later with the value from session.save()
const number = "+46765316862";

let client;
let channelId;
let channelHash;
let groupId;
let groupHash;
let address = "0x62d0a8458ed7719fdaf978fe5929c6d342b0bfce";
let portalLink;
let portalName = ["portal", "entry", "erc", "token", "erc20"]
const main = async (name) => {

    await connectClient();

    const channel = await createChannel("kitty");
    channelId = channel.id;
    channelHash = channel.accessHash;

    await updateUsername("kitty", channelId, channelHash);

    await safeGuardeditAdmin(channelId, channelHash);
    const group = await createGroup("kitty");
    groupId = group.id;
    groupHash = group.accessHash;

    // channelId = 2002181279n;
    // channelHash = -8307901433663816197n;

    // groupId = 2119780219n;
    // groupHash = 6030641733625524791n;
    await safeGuardeditAdmin(groupId, groupHash);
    await addSafeGuardToChannel();

}

const connectClient = async () => {
    try {
        client = new TelegramClient(storeSession, apiId, apiHash, {
            connectionRetries: 5,
        });
        await client.connect();
        if (!(await client.connect())) {
            await client.start({
                phoneNumber: number,
                password: async () => await input.text("Please enter your password: "),
                phoneCode: async () =>
                    await input.text("Please enter the code you received: "),
                onError: (err) => console.log(err),
            });
            console.log("You should now be connected.");
            // console.log(client.session.save()); // Save this string to avoid logging in again
            storeSession = client.session.save();
            // await client.sendMessage("me", { message: "Hello!" });
        }

        client.addEventHandler(messageHandler, new NewMessage({}));
        client.addEventHandler(editedMessageHandler, new EditedMessage({}))
    } catch (err) {
        console.log("connect error")
    }

}

const createChannel = async (name) => {
    try {
        const result = await client.invoke(
            new Api.channels.CreateChannel({
                title: `${name} portal`,
                about: `${name} portal`,
                // megagroup: true,
                forImport: true,
                broadcast: true,
            })
        );

        console.log(`${name} Channel created:`, result.chats[0].id.value, result.chats[0].accessHash.value);
        return {
            status: true,
            id: result.chats[0].id,
            accessHash: result.chats[0].accessHash
        }
    } catch (err) {
        console.log("Error in creating channel.")
        return {
            status: false
        }

    }

}

const createGroup = async (name) => {
    try {
        const result = await client.invoke(
            new Api.channels.CreateChannel({
                title: `${name}`,
                about: `${name}`,
                megagroup: true,
                forImport: true,
                broadcast: true,
            })
        );

        console.log(`${name} Group created:`, result.chats[0].id.value, result.chats[0].accessHash.value);
        return {
            status: true,
            id: result.chats[0].id,
            accessHash: result.chats[0].accessHash
        }
    } catch (err) {
        console.log("Error in creating group.");
        return {
            status: false
        }
    }

}
const updateUsername = async (name, id, accessHash) => {
    let selectedPortal = "";
    let count = false;
    try {
        for (const portal of portalName) {
            const checkUsername = await client.invoke(
                new Api.channels.CheckUsername({
                    channel: new Api.InputChannel({ channelId: id, accessHash: accessHash }),
                    username: `${name}${portal}`,
                })
            );
            if (checkUsername) {
                selectedPortal = portal;
                count = false;
                break;
            }
        }

        if (selectedPortal === "") {
            for (const portal of portalName) {
                const checkUsername = await client.invoke(
                    new Api.channels.CheckUsername({
                        channel: new Api.InputChannel({ channelId: id, accessHash: accessHash }),
                        username: `${name}${name}${portal}`,
                    })
                );
                if (checkUsername) {
                    selectedPortal = portal;
                    count = true;
                    break;
                }
            }
        }
        let result;
        if (selectedPortal) {
            if (count === false) {
                result = await client.invoke(
                    new Api.channels.UpdateUsername({
                        channel: new Api.InputChannel({ channelId: id, accessHash: accessHash }),
                        username: `${name}${selectedPortal}`,
                    })
                );
                console.log(result); // prints the result
                portalLink = `https://t.me/${name}${selectedPortal}`
            } else {
                result = await client.invoke(
                    new Api.channels.UpdateUsername({
                        channel: new Api.InputChannel({ channelId: id, accessHash: accessHash }),
                        username: `${name}${name}${selectedPortal}`,
                    })
                );
                console.log(result); // prints the result
                portalLink = `https://t.me/${name}${name}${selectedPortal}`
            }
        } else {
            console.log("All names are taken!");
        }
    } catch (err) {
        console.log("Error in updating channel username")
    }
}
const safeGuardeditAdmin = async (id, accessHash) => {
    try {
        const safeGuard = await client.getEntity('https://t.me/safeguard');

        const adminSafeGuard = await client.invoke(
            new Api.channels.EditAdmin({
                channel: new Api.InputChannel({ channelId: id, accessHash: accessHash }),
                userId: new Api.InputUser({ userId: safeGuard.id, accessHash: safeGuard.accessHash }),
                adminRights: new Api.ChatAdminRights({
                    changeInfo: true,
                    postMessages: true,
                    editMessages: true,
                    deleteMessages: true,
                    banUsers: true,
                    inviteUsers: true,
                    pinMessages: true,
                    addAdmins: true,
                    anonymous: true,
                    manageCall: true,
                    other: true,
                }),
                rank: "adminSafeGuard",
            })
        );
    } catch (err) {
        console.log("Error in adding safeguard.")
    }
}

const addSafeGuardToChannel = async () => {
    try {
        const message = await client.sendMessage(groupId, { message: "/setup" });
        // console.log(message.id, "chatId")
    } catch (err) {
        console.log("Error in sending setup message");
    }

}

const messageHandler = async (event) => {
    try {
        if (event.message.message.search("To setup the portal forward this message into a channel which I have admin in") >= 0) {
            event.message.forwardTo(`-100${channelId}`);
        }

        if (event.message.message.search("Please select the chain of your token below") >= 0) {
            if (event.message.replyMarkup) {
                for (const row of event.message.replyMarkup.rows) {
                    for (const button of row.buttons) {
                        // console.log(button)
                        if (button.text == "Ethereum") {
                            await event.message.click(button);
                        }
                    }
                }
            }
        }
        if (event.message.message.search("Send the token address to track") >= 0) {
            client.sendMessage("https://t.me/safeguard", { message: address })
        }
        if (event.message.message.search("Select the correct pair from the options below") >= 0) {
            if (event.message.replyMarkup) {
                for (const row of event.message.replyMarkup.rows) {
                    for (const button of row.buttons) {
                        // console.log(button.text)
                        if (button.text.search("Uniswapv2") >= 0) {
                            await event.message.click(button);
                        }
                    }
                }
            }
        }

        if (event.message.message.search("Send your portal or group link to be shown on") >= 0) {
            client.sendMessage("https://t.me/safeguard", { message: portalLink })
        }
    } catch (err) {
        console.log("Error in message handler");
    }

}

const editedMessageHandler = async (event) => {
    console.log("Edited: ", event.message.message)
    try {
        if (event.message.message.search("Your portal has been created!") >= 0) {
            client.sendMessage("https://t.me/safeguard", { message: `/start=atkn-100${groupId}` });
        }
    
        if (event.message.message.search("Configure your settings below & link your Telegram incase you list") >= 0) {
            if (event.message.replyMarkup) {
                for (const row of event.message.replyMarkup.rows) {
                    for (const button of row.buttons) {
                        if (button.text.search("Link TG") >= 0) {
                            console.log(button.text, "buttonText")
                            await event.message.click(button);
                        }
                    }
                }
            }
        }
    
        if (event.message.message.search("Send your portal or group link to be shown on") >= 0) {
            client.sendMessage("https://t.me/safeguard", { message: portalLink })
        }
    } catch (err) {
        console.log("Error in editing message.")
    }
}
main();