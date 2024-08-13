import { useContext, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "../../components/Buttons";
import { ArbitraryInput, TextInput, exportResponses } from "../../components/Inputs";
import { TextInputObject } from "../../helpers/inputs";
import { isNotEmpty, validateEmail } from "../../helpers/inputValidators";
import { API, CONNECTION_ERROR, SERVER_ERROR } from "../../helpers/constants";
import { CurrentUserContext, PageStateContext } from "../../context";
import { UserAccount } from "../../helpers/classes";

function LoginForm(){
    const inputs = useRef([
        new TextInputObject("Email", "", isNotEmpty("Email is required")),
        new TextInputObject("Password", "", isNotEmpty("Password is required"), {semanticType: "password"}),
    ]);
    const [isValidating, letValidate] = useState(false);
    const navigate = useNavigate();
    const user = useContext(CurrentUserContext);
    const pageState = useContext(PageStateContext);
    
    async function onSubmit(e:React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        const [responses, hasError] = exportResponses(inputs.current);
        letValidate(true);
        if (hasError) return;

        pageState?.letLoading(true);

        try {
            const res = await fetch(API + "/accounts/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    'Content-Type': "application/json"
                },
                body: JSON.stringify({
                    email: responses["Email"],
                    password: responses["Password"]
                })
            });
            pageState?.letLoading(false);
            if (res.ok){
                user?.setUser(UserAccount.fromJSON(await res.json()));
                pageState?.setErrMsg("", null);
                navigate("/", {replace:true});
            } else if (res.status == 500){
                pageState?.setErrMsg(SERVER_ERROR, 3000);
            } else {
                pageState?.setErrMsg((await res.json()).message, 3000);
            }
        } catch (e){
            console.error(e);
            pageState?.letLoading(false);
            pageState?.setErrMsg(CONNECTION_ERROR, 3000);
        }
        // TODO: send request to backend
    }
    return <form action='/login' method='post' onSubmit={onSubmit}>
        {/* https://stackoverflow.com/questions/69510795/component-doesnt-update-on-props-change
        Solusi yang sangat hack-y, tapi yang penting errornya langsung ter-update setelah letValidate deh */}
        { inputs.current.map(x => <ArbitraryInput input={x} shouldValidate={isValidating} key={`${x.id}${isValidating}`}/>) }
        <div className="text-center">
            <input type="submit" className="btn btn-primary m-2 p-2 w-50 fw-bold"
                value="Login"/>
        </div>
    </form>
}

export default LoginForm;