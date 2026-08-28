/* import { useEffect } from "react";
import { useRouter } from "expo-router";

import Login from "./auth/login";
import HomeScreen from "./tabs/home"; */

import Login from "./auth/login"


export default function Index() {

  /* const router = useRouter() */

/*   useEffect (() =>{
    const timeout = setTimeout(() => {
      const isLoggedin = false

      if(isLoggedin){
        //router.navigate("/tabs/home")
        return <HomeScreen></HomeScreen>
      }else{
        return <Login/>
      }

    }, 1000)

    return () => clearTimeout(timeout)
  }, [router]) */

  return(
    <Login/>
  )
}
