import { useEffect, useState } from "react";

interface MaybeImageProps {
    src:string,
    alt:string,
    className?:string,
    defaultImage?:string,
    onClick?:()=>void,
}

export let DEFAULT_IMAGE_SOURCE = "/image-not-available.jpg"
export function MaybeImage({src, alt, defaultImage, className, onClick}: MaybeImageProps){
    const [noImage, letNoImage] = useState(false);
    function imageNotAvailable(){
        letNoImage(true);
    }
    return <>{
        noImage ?
        <img className={className} src={DEFAULT_IMAGE_SOURCE} alt={alt} onClick={onClick}/> :
        <img className={"object-fit-cover " + (className ?? '')} src={src} alt={alt} onError={imageNotAvailable} onClick={onClick}/>
    }</>
}