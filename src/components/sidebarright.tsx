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

  
   

 export const SidebarRight = () =>{


    return(
        <aside className="flex right-0 top-0 fixed mt-[5.55rem] dark:bg-[#131C29] bg-[#FFFFFF] flex-col w-[268px] h-full px-5 py-[31.5px] overflow-y-auto   ">
    

    <div className="flex flex-col justify-between flex-1 ">
        <nav className="-mx-3 space-y-7 ">

        
            <div className="space-y-3 flex flex-col ">
                <label className="text-base px-[20px]">Suas páginas</label>
                <a className="flex items-center px-3 text-3xl py-1 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                <div className="flex w-12 h-12 rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671159.jpg?t=st=1710215038~exp=1710218638~hmac=8fbc6f14e022d1ada3127a55bc33079f72090e2cfc669fcdc79c60bfc4cb39c6&w=826')"}} />

                    <span className="mx-2 text-sm font-medium">Bookstage</span>
                </a>

                <a className="flex items-center text-2xl px-3 py-1 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                <div className="flex w-12 h-12 rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?t=st=1710570338~exp=1710573938~hmac=7c30fcf6ab0c36c61b757958d5ef37fccd76a466abeba034238dcd301da7229e&w=826')"}} />



                    <span className="mx-2 text-sm font-medium">Bookstage1</span>
                </a>
           

                <a className="flex items-center text-2xl  px-3 py-1 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                <div className="flex w-12 h-12 rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671132.jpg?t=st=1710570388~exp=1710573988~hmac=819b3fd3a00b89f486428112414d54d24fb232430b2a56e51363ac164745ae7f&w=826')"}} />


                    <span className="mx-2 text-sm font-medium">Bookstage2</span>
                </a>
            </div>

            <div className="space-y-3 flex flex-col ">
                <label className="text-base px-[20px]">Amigos</label>
                <a className="flex items-center px-3 text-3xl py-1 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                <div className="flex w-12 h-12 rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-photo/3d-illustration-young-man-with-beard-mustache_1142-51070.jpg?t=st=1710570481~exp=1710574081~hmac=ceb2609ae5e2460c11ba8b5d449b0bd292103ea107ef5a394f8a7ec3b59a265d&w=826')"}} />

                    <span className="mx-2 text-sm font-medium">Bookstage</span>
                </a>

                <a className="flex items-center text-2xl px-3 py-1 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                <div className="flex w-12 h-12 rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671159.jpg?t=st=1710215038~exp=1710218638~hmac=8fbc6f14e022d1ada3127a55bc33079f72090e2cfc669fcdc79c60bfc4cb39c6&w=826')"}} />



                    <span className="mx-2 text-sm font-medium">Bookstage1</span>
                </a>
           

                <a className="flex items-center text-2xl  px-3 py-1 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                <div className="flex w-12 h-12 rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671159.jpg?t=st=1710215038~exp=1710218638~hmac=8fbc6f14e022d1ada3127a55bc33079f72090e2cfc669fcdc79c60bfc4cb39c6&w=826')"}} />


                    <span className="mx-2 text-sm font-medium">Bookstage2</span>
                </a>

                <a className="flex items-center text-2xl  px-3 py-1 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                <div className="flex w-12 h-12 rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671159.jpg?t=st=1710215038~exp=1710218638~hmac=8fbc6f14e022d1ada3127a55bc33079f72090e2cfc669fcdc79c60bfc4cb39c6&w=826')"}} />


                    <span className="mx-2 text-sm font-medium">Bookstage2</span>
                </a>

                <a className="flex items-center text-2xl  px-3 py-1 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                <div className="flex w-12 h-12 rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671159.jpg?t=st=1710215038~exp=1710218638~hmac=8fbc6f14e022d1ada3127a55bc33079f72090e2cfc669fcdc79c60bfc4cb39c6&w=826')"}} />


                    <span className="mx-2 text-sm font-medium">Bookstage2</span>
                </a>
            </div>

            <div className="space-y-3 flex flex-col ">
                <label className="text-base px-[20px]">Seus grupos</label>
                <a className="flex items-center px-3 text-3xl py-1 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                <div className="flex w-12 h-12 rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671159.jpg?t=st=1710215038~exp=1710218638~hmac=8fbc6f14e022d1ada3127a55bc33079f72090e2cfc669fcdc79c60bfc4cb39c6&w=826')"}} />

                    <span className="mx-2 text-sm font-medium">Bookstage</span>
                </a>

                <a className="flex items-center text-2xl px-3 py-1 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                <div className="flex w-12 h-12 rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671159.jpg?t=st=1710215038~exp=1710218638~hmac=8fbc6f14e022d1ada3127a55bc33079f72090e2cfc669fcdc79c60bfc4cb39c6&w=826')"}} />



                    <span className="mx-2 text-sm font-medium">Bookstage1</span>
                </a>
           

               
            </div>
        </nav>
    </div>
</aside>
    )
 }