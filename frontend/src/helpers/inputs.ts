export abstract class InputObject<T = any> {
    value:T;
    readonly label:string;
    readonly id:string;
    abstract type: string;
    abstract validate: ()=>string;
    constructor(label:string, initialValue:T){
        this.value = initialValue;
        this.label = label;
        this.id = this.label + Math.random().toString().substring(2);
    }
}

interface TextInputObjectOptions {
    placeholder:string
    semanticType:"email"|"password"|"text"
    isTextarea:boolean
}
export class TextInputObject extends InputObject<string> {
    type: string = "text";
    validate: ()=>string;
    options:TextInputObjectOptions;
    constructor(label:string, initialValue:string, validator:(value:string)=>string|undefined, options:Partial<TextInputObjectOptions>={}){
        super(label, initialValue);
        this.validate = function (){
            return validator(this.value) ?? "";
        }
        this.options = {
            placeholder: options.placeholder ?? label,
            semanticType: options.semanticType ?? "text",
            isTextarea: options.isTextarea ?? false,
        }
    }
}


export type ChoiceInputOption = {label:string, value:string}
export class RadioInputObject extends InputObject<string> {
    type: string = "radio";
    options:ChoiceInputOption[];
    validate: ()=>string;
    constructor(label:string, initialValue:string, options:ChoiceInputOption[], errorMessage:string){
        super(label, initialValue);
        this.options = options;
        this.validate = function (){
            return this.options.find(x => this.value == x.value) ? "" : errorMessage;
        }
    }
}

export class CheckboxInputObject extends InputObject<string[]> {
    type: string = "checkbox";
    options: ChoiceInputOption[];
    validate: ()=>string;
    constructor(label:string, initialValue:string[], options:ChoiceInputOption[], validator:(chosen:string[])=>string){
        super(label, initialValue);
        this.options = options;
        this.validate = function (){
            return validator(this.value);
        }
    }
}

interface FileInputObjectOptions {
    accept:string,
}
export class FileInputObject extends InputObject<File|undefined> {
    type:string = "file"
    options:FileInputObjectOptions
    validate: () => string;
    constructor(label:string, validator: (file?:File) => string, options?:Partial<FileInputObjectOptions>){
        super(label, undefined);
        this.options = {
            accept: options?.accept ?? "*",
        }
        this.validate = ()=>validator(this.value);
    }
}

export const TypeGuards = {
    isText(input:InputObject): input is TextInputObject {
        return input.type == "text";
    },
    isRadio(input:InputObject): input is RadioInputObject {
        return input.type == "radio";
    },
    isCheckbox(input:InputObject): input is CheckboxInputObject {
        return input.type == "checkbox";
    },
    isFile(input:InputObject): input is FileInputObject {
        return input.type == "file";
    }
}