"use client"

import { PiCirclesThreePlusLight } from "react-icons/pi";
import { IoPersonOutline } from "react-icons/io5";
import { RiBook2Line } from "react-icons/ri";
import { FaRegBookmark } from "react-icons/fa";

import { GrGroup } from "react-icons/gr";
import { CgMoreO } from "react-icons/cg";

import { LiaUserFriendsSolid } from "react-icons/lia";

import Image from "next/image"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  
  import * as React from "react"
  import { Moon, Sun } from "lucide-react"
  import { useTheme } from "next-themes"
  import { Label } from "@/components/ui/label"
  import { Switch } from "@/components/ui/switch"
import { useState } from "react";

  
   

 export const Sidebar = () =>{

    const { theme, setTheme } = useTheme()

    return(
        <aside className="flex fixed mt-[5.55rem] dark:bg-[#131C29] bg-[#FFFFFF] flex-col w-[268px] h-full px-5 py-[31.5px] overflow-y-auto   ">
    

    <div className="flex flex-col justify-between flex-1 ">
        <nav className="-mx-3 space-y-7 ">

        <a className="flex w-full px-3 py-2 rounded-lg ring-2 ring-[#EEEEEE] dark:ring-[#EEEEEE]/5 items-center gap-3" href="#">
        <div className="flex w-12 h-12 rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671159.jpg?t=st=1710215038~exp=1710218638~hmac=8fbc6f14e022d1ada3127a55bc33079f72090e2cfc669fcdc79c60bfc4cb39c6&w=826')"}}>
    </div>
                    <div className="flex flex-col">
                        <p className="font-semibold text-sm">Luis Gustavo David</p>
                        <span className="text-xs text-gray-400 font-medium">@luluzinho</span>
                    </div>
                </a>
            <div className="space-y-3 flex flex-col ">

                <a className="flex items-center px-3 text-3xl py-4 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                    <PiCirclesThreePlusLight/>

                    <span className="mx-2 text-sm font-medium">Feed</span>
                </a>

                <a className="flex items-center text-2xl px-3 py-4 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                <IoPersonOutline />


                    <span className="mx-2 text-sm font-medium">Perfil</span>
                </a>
           

                <a className="flex items-center text-2xl  px-3 py-4 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                    <LiaUserFriendsSolid/>

                    <span className="mx-2 text-sm font-medium">Amigos</span>
                </a>

                <a className="flex items-center text-2xl px-3 py-4 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                    <RiBook2Line/>

                    <span className="mx-2 text-sm font-medium">Livros</span>
                </a>

                <a className="flex items-center text-2xl px-3 py-4 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                    <FaRegBookmark/>

                    <span className="mx-2 text-sm font-medium">Itens salvos</span>
                </a>
            
                

                <a className="flex items-center text-2xl px-3 py-4 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                    <GrGroup/>

                    <span className="mx-2 text-sm font-medium">Conhecer</span>
                </a>
                <DropdownMenu >
                <DropdownMenuTrigger className="flex items-center text-2xl px-3 py-4 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]">
                    <CgMoreO/>

                    <span className="mx-2 text-sm font-medium">Mais</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[255px]">
    <DropdownMenuLabel className="flex justify-between py-3 px-2">Alternar Modo  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /> <Moon className="absolute right-3 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />

    </DropdownMenuLabel>
    <DropdownMenuSeparator />
   
        <div className="flex py-3 px-2 gap-2 items-center space-x-2">
        <Switch id="theme-mode" checked={theme === "dark"} onChange={() => setTheme(theme === "dark" ? "light" : "dark")} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}/>
        <Label htmlFor="theme-mode">Modo Escuro</Label>
      </div>
       
 
  </DropdownMenuContent>
                </DropdownMenu>
                

  


                <a className="flex items-center justify-center px-3 py-4 text-white transition-colors duration-300 transform rounded-full dark:text-gray-200 bg-[#1358E3] hover:bg-[#004add]  dark:hover:text-gray-200 hover:text-gray-100" href="#">
                    Publicar
                </a>
            </div>
        </nav>
    </div>
</aside>
    )
 }