import { STORAGE } from "./constants";

export class UserAccount {
    readonly id:number;
    name:string;
    email:string;
    bio:string;
    pfp:string;
    constructor(id:number, email:string, name:string, bio:string, pfp:string){
        this.id = id;
        this.name = name;
        this.email = email;
        this.bio = bio;
        this.pfp = pfp;
    }
    static fromJSON(json:any){
        return new UserAccount(json.id, json.email, json.name, json.bio, STORAGE + json.pfp);
    }
}

export class Message {
    readonly id:number;
    user:UserAccount;
    message:string;
    time:Date;
    type:string = "user"
    constructor(id:number, user:UserAccount, message:string, time:Date){
        this.id = id;
        this.user = user;
        this.message = message;
        this.time = time;
    }
    get waktu(){
        return this.time.toLocaleString();
    }
    static fromJSON(json:any): Message {
        return new Message(json.id, UserAccount.fromJSON(json.user), json.message, new Date(json.time));
    }
}
export class EphemeralMessage extends Message {
    type = "ephemeral"
    constructor(user:UserAccount, message:string){
        super(Math.random(), user, message, new Date()); 
    }
    static isEphemeral(message:Message): message is EphemeralMessage {
        return message.type == "ephemeral";
    }
}

export interface ChatroomSettings {
    title:string;
    thumbnail:string;
    description:string;
    isToxicityFiltered:boolean;
    isPublic:boolean;
}
export class ChatroomInfo {
    // Untuk ditampilkan di halaman /home
    readonly id:number;
    owner:UserAccount;
    settings:ChatroomSettings
    constructor(id:number, owner:UserAccount, settings:ChatroomSettings){
        this.id = id;
        this.owner = owner;
        this.settings = settings;
    }
    static fromJSON(json:any){
        return new ChatroomInfo(
            json.id,
            UserAccount.fromJSON(json.owner),
            {...json.settings, thumbnail: STORAGE + json.settings.thumbnail}
        )
    }
    static fromJSONArray(json:any[]){
        return json.map((x:any) => ChatroomInfo.fromJSON(x));
    }
}

export class Chatroom {
    readonly id:number;
    readonly owner:UserAccount;
    members:UserAccount[];
    settings:ChatroomSettings;
    invite:string;
    constructor(id:number, owner:UserAccount, members:UserAccount[], invite:string, settings:ChatroomSettings){
        this.id = id;
        this.owner = owner;
        this.members = members;
        this.settings = settings;
        this.invite = invite;
    }
    withInvite(link:string){
        return new Chatroom(
            this.id,
            this.owner,
            this.members,
            link,
            this.settings
        );
    }
    withSettings(settings:Partial<ChatroomSettings>){
        return new Chatroom(
            this.id,
            this.owner,
            this.members,
            this.invite,
            {
                title: settings.title || this.settings.title,
                description: settings.description || this.settings.description,
                thumbnail: settings.thumbnail || this.settings.thumbnail,
                isToxicityFiltered: settings.isToxicityFiltered ?? this.settings.isToxicityFiltered,
                isPublic: settings.isPublic ?? this.settings.isPublic,
            }
        );
    }
    static fromJSON(json:any){
        return new Chatroom(
            json.id,
            UserAccount.fromJSON(json.owner),
            json.members.map((x:any) => UserAccount.fromJSON(x)),
            json.invite,
            {
                ...json.settings,
                thumbnail: STORAGE + json.settings.thumbnail,
            }
        )
    }
    static fromJSONArray(json:any[]){
        return json.map((x:any) => ChatroomInfo.fromJSON(x));
    }
}