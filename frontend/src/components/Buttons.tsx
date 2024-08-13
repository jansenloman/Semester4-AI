import { useNavigate } from "react-router-dom";

interface ButtonProps {
    onClick: (e:React.MouseEvent<HTMLButtonElement>)=>void;
    children: React.ReactNode,
    className?: string,
}

export function PrimaryButton({onClick, className, children}: ButtonProps){
    return <button className={`btn btn-primary m-2 p-2 fw-bold ${className}`} onClick={onClick}>
        { children }
    </button>
}

export function DangerButton({onClick, className, children}: ButtonProps){
    return <button className={`btn btn-danger m-2 p-2 fw-bold ${className}`} onClick={onClick}>
        { children }
    </button>
}

export function BackButton(){
    const navigate = useNavigate();
    function goBack(){
        navigate(-1);
    }
    return <button className="back-button d-flex align-items-center"
    title="Go Back" onClick={goBack}>
        <div></div>
        <div></div>
    </button>
}