"use client"
import {dark} from "@clerk/themes"
import {useCurrentTheme} from "@/hooks/use-current-theme"
import {UserButton} from "@clerk/nextjs"

interface Props{
    ShowName?:boolean
}

export const UserControl = ({ShowName}:Props)=>{
    const currentTheme = useCurrentTheme();
       // READ ONLY: Checking for plan and sandbox logic
    return(
        <UserButton 
        showName={ShowName}
        appearance={{
            elements:{
                userButtonBox:"rounded-md!",
                userButtonAvatarBox:"rounded-md! size-8!",
                userButtonTrigger:"rounded-md!",
            },
            baseTheme:currentTheme === "dark" ? dark : undefined,
        }}/>
    )
}