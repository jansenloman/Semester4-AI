export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
export const NAME_REGEX = /^[a-zA-Z0-9]+$/
export const PHONE_REGEX = /^[0-9]{10,12}$/

export function validateEmail(email:string){
    if (email.length == 0) return "Email is required";
    else if (!email.match(EMAIL_REGEX)) return "Invalid email format";
}
export function validatePassword(password:string){
    return password.length < 8 ? "Password must consist of at least 8 characters" : "";
}
export function validateName(name:string){
    if (name.length < 5) return "Name must consist of at least 5 characters";
    else if (!name.match(NAME_REGEX)) return "Name must only consist of characters and digits";
}
export function validateChatroomTitle(title:string){
    if (title.length < 5) return "Chatroom title must consist of at least 5 characters";
    else if (!title.match(NAME_REGEX)) return "Chatroom title must only consist of characters and digits";
}
export function validatePhoneNumber(phone:string){
    if (phone.length == 0) return "Phone number is required";
    else if (!phone.match(PHONE_REGEX))  return "Phone number must consist of 10-12 digits";
}
export function isNotEmpty(errorMessage:string){
    return (value:string) => value.length > 0 ? "" : errorMessage;
}
export function noValidate(){
    return "";
}