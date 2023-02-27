export type EIP = {
    name: string,
    bulkName: string,
    isDeleted: boolean,
    websitePublished: boolean,
    members: {
        id: string,
        login: string,
        isLeader: boolean
    }[],
    url: string
}

export class EWatcher {

    public static EIPs : {
        name: string,
        isDeleted: boolean,
        websitePublished: boolean,
        members: string[],
        url: string,
    }[] = [];

    public static addAnEip(name: string) {
        this.EIPs.push({
            name: name,
            isDeleted: true,
            websitePublished: true,
            members: [],
            url: "https://eip.eitech.eu/2024/" + name.toLocaleLowerCase().split(" ").join("") + "/"
        })
    }
}