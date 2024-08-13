import { ReactNode, useState } from "react";
import { CheckboxInputObject, FileInputObject, InputObject, TextInputObject, TypeGuards } from "../helpers/inputs";

interface InputProps<IO extends InputObject> {
    input:IO,
    className?:string,
    shouldValidate?:boolean,
}

export function useValidateInput<T, ET>(input:InputObject<T>, parser:(raw:React.ChangeEvent<ET>, current:T) => T, shouldValidate?:boolean){
    const [error, setError] = useState(shouldValidate ? input.validate() : "");
    const [value, setValue] = useState(input.value);
    function onInput(e: React.ChangeEvent<ET>){
        input.value = parser(e, input.value);
        setValue(input.value);
        if (shouldValidate){
            setError(input.validate());
        }
    }
    return {error, value, onInput};
}
export function TextInput({input, className, shouldValidate}:InputProps<TextInputObject>){
    const {error, value, onInput} = useValidateInput<string, HTMLInputElement>(input, raw => raw.target.value, shouldValidate);
    return <div className="m-3">
        <label className="fw-medium" htmlFor={input.id}>{input.label}</label>
        <input
            type={input.options.semanticType || 'text'}
            placeholder={input.label}
            className={className ?? ''}
            onChange={onInput}
            value={value}
            id={input.id}
        />
        {error.length > 0 && <p className="fw-medium text-danger">{ error }</p>}
    </div>
}

export function TextareaInput({input, className, shouldValidate}:InputProps<TextInputObject>){
    const {error, value, onInput} = useValidateInput<string, HTMLTextAreaElement>(input, raw => raw.target.value, shouldValidate);
    return <div className="m-3">
        <label className="fw-medium" htmlFor={input.id}>{input.label}</label>
        <textarea
            placeholder={input.label}
            className={className ?? ''}
            onChange={onInput}
            value={value}
            id={input.id}
        ></textarea>
        {error.length > 0 && <p className="fw-medium text-danger">{ error }</p>}
    </div>
}

export function FileInput({input, className, shouldValidate}:InputProps<FileInputObject>){
    const {error, value, onInput} = useValidateInput<File|undefined, HTMLInputElement>(input, raw => raw.target.files?.[0], shouldValidate);
    return <div className="m-3">
        <label className="fw-medium input-file">
            <input
                type="file"
                placeholder={input.label}
                className={className ?? ''}
                onChange={onInput}
                accept={input.options.accept}
            />
            {value ? value.name : input.label}
        </label>
        {error.length > 0 && <p className="fw-medium text-danger">{ error }</p>}
    </div>
}

export function ArbitraryInput({input, className, shouldValidate}:InputProps<InputObject>){
    if (TypeGuards.isText(input)){
        if (input.options.isTextarea) return <TextareaInput input={input} className={className} shouldValidate={shouldValidate}/>
        else return <TextInput input={input} className={className} shouldValidate={shouldValidate}/>
    } else if (TypeGuards.isFile(input)){
        return <FileInput input={input} className={className} shouldValidate={shouldValidate}/>
    } else if (TypeGuards.isCheckbox(input)){
        return <CheckboxInput input={input} className={className} shouldValidate={shouldValidate}/>
    }else {
        return <h2 className="text-danger">{input.type} is not implemented!</h2>
    }
}

export function CheckboxInput({input, shouldValidate, className}:InputProps<CheckboxInputObject>){
    const {error, value, onInput} = useValidateInput<string[], HTMLInputElement>(input, (e, cur)=>{
        if (e.target.checked) return [...cur, e.target.value];
        else return cur.filter(x => x != e.target.value);
    }, shouldValidate);
    return <div className="m-3">
        <p className="fw-medium m-0">
            { input.label }
        </p>
        {
            input.options.map(opt => 
                <div className="form-check" key={opt.value}>
                    <label
                        className="form-check-label"
                        htmlFor={opt.label + ' ' + input.id}
                    >{ opt.label }</label>
                    <input
                        className = "form-check-input"
                        type = "checkbox"
                        value = {opt.value}
                        id={opt.label + ' ' + input.id}
                        name={input.id}
                        checked={value.includes(opt.value)}
                        onChange={onInput}/>
                </div>
            )
        }
        {error && <div className="text-danger">{ error }</div>}
    </div>
}

export function exportResponses(inputs:InputObject[]):[{[key:string]:any}, boolean]{
    let hasError = false;
    const responses:{[key:string]:any} = {};
    for (let input of inputs){
        responses[input.label] = input.value;
        if (input.validate()){
            hasError = true;
        }
    }
    return [responses, hasError];
}