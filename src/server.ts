import { app } from "./app";

async function init() {
    app.listen(4000, () => {
        console.log("Server launched successfully");
    })
}

init();