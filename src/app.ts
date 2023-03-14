import axios from "axios";
import express, {Request, Response, NextFunction, urlencoded} from "express";
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import Grabber from "./utils/grabber";
import { EIP } from "./utils/ewatcher";

const app = express();
const grabber = new Grabber();

let lastFetch = null;
let isLoading = false;

let eips :EIP[] = null

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}))

const fetchEIPs = async (req: Request, res: Response, next: NextFunction) => {
    if (!grabber.isAuthentified()) {
        if (req.method == "POST") {
            if (!req.body.email || !req.body.password) {
                return res.render("auth", {err:"body"});
            }
            grabber.setAccountInfo(req.body.email, req.body.password);
            const auth = await grabber.authenticate();
            if (!auth) {
                return res.render("auth", {err:"creds"});
            }
        } else {
            return res.render("auth", {err:""});
        }
    }
    const actDate = Math.floor(new Date().getTime() / 1000);
    let nextFetch :number = (lastFetch + (60 * 60 * 24 * 3)) - actDate;
    if (eips == null || nextFetch <= 0) {
        isLoading = true;
        res.render("fetching");
        Promise.resolve().then(function () {
            new Promise(async (resolve, reject) => {
                try {
                    eips = await grabber.fetchGroups();
                } catch (e) {
                    const auth = await grabber.authenticate();
                    if (!auth) {
                        return res.render("auth", {err:"creds"});
                    }
                    try {
                        eips = await grabber.fetchGroups();
                    } catch (e) {
                        console.error(e);
                        process.exit(1);
                    }
                }
                lastFetch = actDate;
                nextFetch = actDate - (lastFetch + (60 * 60 * 24 * 3));
                isLoading = false;
                return;
            }).then();
        })
    }
    req.nextFetch = nextFetch.toString();
    req.eips = eips;
    next();
}

const nancyEmails = [
    "arthur.junges@epitech.eu","alexandre.boul@epitech.eu","alexandre.burger@epitech.eu","benjamin.lafouge@epitech.eu","mehdi.meknaci@epitech.eu","virgile.agnel@epitech.eu",
    "quentin.marchand@epitech.eu","charles1.hu@epitech.eu","francois.rolland@epitech.eu","maxime.saidi@epitech.eu","raphael.mandica@epitech.eu","theo.grosjean@epitech.eu","thomas.moreau@epitech.eu",
    "samuel.palmer@epitech.eu","abdelmalik.achite-henni@epitech.eu","mathieu.blais@epitech.eu",
    "maxence.marques-pierre@epitech.eu","eliott.ferry@epitech.eu","floriane.mantey@epitech.eu","jean.gauthier-damioli@epitech.eu","jules.martin@epitech.eu","pierre.brun@epitech.eu","pierre.fricker@epitech.eu","thibaut.humbert@epitech.eu","tom.wederich@epitech.eu",
    "pierre.perrin@epitech.eu","aurelien.le-camus@epitech.eu","aurelien.schulz@epitech.eu","gabriel.huguenin-dumittan@epitech.eu","theo.hemmer@epitech.eu","yann.julitte@epitech.eu","yohann.cormier@epitech.eu",
]

app.get("/isLoading", (req, res) => {
    return res.status(200).send(isLoading);
});

app.get("/", fetchEIPs, (req, res) => {
    if (eips == null) {
        return res.render("fetching");
    }
    const fromNancy = eips.filter(x => { return (x.members.find(m => nancyEmails.includes(m.login)) != undefined) } )
    res.render("index", {
        eips: req.eips,
        nextRefresh : req.nextFetch,
        usingAccount: grabber.getAccountMail(),
        published: eips.filter(x => x.websitePublished && !x.isDeleted),
        nonPublished: eips.filter(x => !x.websitePublished && !x.isDeleted),
        deleted: eips.filter(x => x.isDeleted),
        fromNancy: fromNancy
    })
});

app.post("/", fetchEIPs, (req, res) => {
    if (eips == null) {
        return res.render("fetching");
    }
    const fromNancy = eips.filter(x => { return (x.members.find(m => nancyEmails.includes(m.login)) != undefined) } )
    res.render("index", {
        eips: req.eips,
        nextRefresh : req.nextFetch,
        usingAccount: grabber.getAccountMail(),
        published: eips.filter(x => x.websitePublished && !x.isDeleted),
        nonPublished: eips.filter(x => !x.websitePublished && !x.isDeleted),
        deleted: eips.filter(x => x.isDeleted),
        fromNancy: fromNancy
    })
});

export { app };