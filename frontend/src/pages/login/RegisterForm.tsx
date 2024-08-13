import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArbitraryInput, exportResponses } from "../../components/Inputs";
import { FileInputObject, TextInputObject } from "../../helpers/inputs";
import { isNotEmpty, validateEmail, validateName, validatePassword } from "../../helpers/inputValidators";
import { API, CONNECTION_ERROR, SERVER_ERROR } from "../../helpers/constants";
import { CurrentUserContext, PageStateContext } from "../../context";
import { UserAccount } from "../../helpers/classes";

interface RegisterFormInputLabels {
    "Email":string,
    "Password":string,
    "Name":string,
    "About You":string,
    "Profile Picture":File
}

function RegisterForm(){
    const inputs = useRef([
        new TextInputObject("Email", "", validateEmail, {semanticType: "email"}),
        new TextInputObject("Password", "", validatePassword, {semanticType: "password"}),
        new TextInputObject("Name", "", validateName),
        new TextInputObject("About You", "", (value)=>"", {isTextarea: true}),
        new FileInputObject("Profile Picture", (file)=>(file ? "" : "Profile picture is required"), {
            accept: "image/*"
        })
    ]);
    const [isValidating, letValidate] = useState(false);
    const navigate = useNavigate();
    const pageState = useContext(PageStateContext);
    const user = useContext(CurrentUserContext);
    
    function createFormData(responses:RegisterFormInputLabels){
        const formData = new FormData();
        formData.append("email", responses["Email"]);
        formData.append("password", responses["Password"]);
        formData.append("name", responses["Name"]);
        formData.append("bio", responses["About You"]);
        formData.append("pfp", responses["Profile Picture"]);
        return formData;
    }

    async function onSubmit(e:React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        const [responses, hasError] = exportResponses(inputs.current);
        letValidate(true);
        if (hasError) return;

        const formData = createFormData(responses as unknown as RegisterFormInputLabels);

        pageState?.letLoading(true);
        try {
            const res = await fetch(API + "/accounts/register", {
                credentials: "include",
                method: "POST",
                body: formData
            });
            pageState?.letLoading(false);
            pageState?.cleanup()
            if (res.ok){
                user?.setUser(UserAccount.fromJSON(await res.json()));
                navigate("/", {replace:true});
            } else if (res.status == 500){
                pageState?.setErrMsg(SERVER_ERROR, 3000);
            } else {
                pageState?.setErrMsg((await res.json()).message, 3000);
            }
        } catch (err){
            console.error(err);
            pageState?.letLoading(false);
            pageState?.setErrMsg(CONNECTION_ERROR, 3000);
        }
    }
    return <form action='/register' method='post' onSubmit={onSubmit}>
        {/* https://stackoverflow.com/questions/69510795/component-doesnt-update-on-props-change
        Solusi yang sangat hack-y, tapi yang penting errornya langsung ter-update setelah letValidate deh */}
        { inputs.current.map(x => <ArbitraryInput input={x} shouldValidate={isValidating} key={`${x.id}${isValidating}`}/>) }
        <div className="text-center">
            <input type="submit" className="btn btn-primary m-2 p-2 w-50 fw-bold"
                value="Register"/>
        </div>
    </form>
}

export default RegisterForm;