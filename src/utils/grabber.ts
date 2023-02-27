import axios, { AxiosInstance } from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { EIP } from "./ewatcher";

export default class Grabber {

    private client: AxiosInstance;
    private cleanClient: AxiosInstance;

    private logInfo: {
        id: string,
        login: string,
        email: string,
        token: string,
    } = null;

    private useMail = null;
    private usePassword = null;

    constructor() {
        const jar = new CookieJar();
        const client = wrapper(axios.create({ jar }));
        this.client = client;
        this.cleanClient = axios.create();
    }

    public setAccountInfo = (email: string, password: string) => {
        this.useMail = email;
        this.usePassword = password;
    }

    public authenticate(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            if (!this.useMail || !this.usePassword) {
                resolve(false);
                return;
            }
            await this.client.get("https://eip.epitech.eu/");
            this.client.post("https://eip.epitech.eu/api/login", {
                login: this.useMail,
                password: this.usePassword
            }).then((response) => {
                this.logInfo = {
                    id: response.data.id,
                    login: response.data.login,
                    email: response.data.email,
                    token: response.data.token
                }
                resolve(true)
            }).catch((error) => {
                resolve(false)
            })
        })
    }

    public fetchGroups(): Promise<EIP[]> {
        return new Promise(async (resolve, reject) => {
            this.client.get("https://eip.epitech.eu/api/groups", {
                params: {
                    page: 1,
                    limit: 200,
                    sort: "-promotion,fancyName",
                    promotion: 2024
                },
                headers: {
                    "x-api-token": this.logInfo?.token || "QuTH5nMG1ssOQNx38hI2aPP7pfKC7V5GLQsHhJqPygaI2hC4-uRFk-FrKQo7Eryj"
                }
            }).then(async (response) => {
                const eips: EIP[] = [];
                response.data.items.forEach(element => {
                    const one :EIP = {
                        name: element.fancyName,
                        bulkName: element.codeName,
                        isDeleted: element.fancyName.startsWith("dd") || (!element.membersRef),
                        websitePublished: false,
                        members: [],
                        url: element.website
                    }
                    if (!one.isDeleted) { 
                        element.membersRef.forEach(member => {
                            one.members.push({
                                id: member.id,
                                login: member.login,
                                isLeader: (member.leader == true)
                            })
                        })
                    }
                    eips.push(one);
                });
                await this.fetchAndUpdateWebsites(eips);
                resolve(eips)
            }).catch(async (error) => {
                if (error.status == 401) {
                    try {
                        await this.authenticate();
                        return resolve(await this.fetchGroups());
                    } catch (e) {
                        reject(false)
                    }
                }
                reject(false)
            })
        })
    }

    private debug = 10;

    private _fetchOneWebsite(eip: EIP): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.debug <= 0) {
                resolve(true);
                return;
            }
            this.cleanClient.get(eip.url, {})
                .then((response) => {
                    if (response.data.startsWith('This is empty.')) {
                        eip.websitePublished = false;
                        resolve(false)
                    } else {
                        eip.websitePublished = true;
                        resolve(true)
                    }                    
                })
                .catch((error) => {
                    resolve(false)
                })
        })
    }

    public fetchAndUpdateWebsites(eips: EIP[]): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            const promList :Promise<boolean>[] = eips.map(x => this._fetchOneWebsite(x));
            await Promise.all(promList);
            resolve(true);
        })
    }

    public isAuthentified() {
        return this.logInfo != null;
    }

    public getAccountMail() {
        return this.logInfo.email;
    }

}