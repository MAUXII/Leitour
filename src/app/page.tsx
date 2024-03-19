import { CreateP } from "@/components/Posts/createpost";
import { Post } from "@/components/Posts/post";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { SidebarRight } from "@/components/sidebarright";
import { FaPlus } from "react-icons/fa";

import Image from "next/image";

export default function Home() {
  return (
    <main className=" bg-white min-h-screen dark:bg-gray-900">
      <div className="h-full">
      <Navbar />
      <div className="h-full w-full">
      <Sidebar />
      <section className="w-full pl-[18.625rem] pr-[1.875rem] justify-center pt-[7.5rem] h-full flex  ">
        
        <div className="w-full max-w-[54.25rem] flex flex-col justify-center items-center gap-4">

        
       <CreateP/>
       <div className="flex flex-col gap-3 px-[.875rem]">
       <Post/>
       <Post/>
       <Post/>
       <Post/>
       <Post/>
       <Post/>
       <Post/>
       </div>
       </div>
       <div className="flex ml-[1.875rem] flex-col max-w-[25rem] h-fit w-full gap-2 pt-[.625rem]  rounded-lg dark:bg-[#15202B]/50 bg-[#FFFFFF] ">
        <p className=" text-base px-[1.25rem]">Stories</p>
        <div className="w-full mt-1 h-[.0625rem] bg-[#EEEEEE] dark:bg-[#f4f4f4]/10"></div>
        <div className="flex items-center gap-[.625rem] px-3 text-2xl py-1 rounded-lg ">
                <a className="flex cursor-pointer hover:text-xl transition-all w-12 h-12 items-center justify-center rounded-full bg-[#FFFFFF] dark:text-[#1358E3] text-[#1358E3]" style={{filter: 'drop-shadow(0rem 0rem .625rem rgba(19, 88, 227, 0.30));'}}>
                  <FaPlus className=""/>
                </a>
                    <div className="flex flex-col">
                      <span className="mx-2 text-sm font-normal">Crie seu storie</span>
                      <span className="mx-2 text-sm font-normal text-[#A6A6A6]">Clique no botão ao lado para criar o seu</span>
                    </div>
                </div>
        <a className="flex items-center px-3 text-3xl py-1 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                <div className="flex w-12 h-12 rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-photo/3d-illustration-young-man-with-beard-mustache_1142-51070.jpg?t=st=1710570481~exp=1710574081~hmac=ceb2609ae5e2460c11ba8b5d449b0bd292103ea107ef5a394f8a7ec3b59a265d&w=826')"}} />

                    <span className="mx-2 text-sm font-medium">Bookstage</span>
                </a>
                <a className="flex items-center px-3 text-3xl py-1 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-[#4784ff] hover:text-[#1358E3]" href="#">
                <div className="flex w-12 h-12 rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-photo/3d-illustration-young-man-with-beard-mustache_1142-51070.jpg?t=st=1710570481~exp=1710574081~hmac=ceb2609ae5e2460c11ba8b5d449b0bd292103ea107ef5a394f8a7ec3b59a265d&w=826')"}} />

                    <span className="mx-2 text-sm font-medium">Bookstage</span>
                </a>
        <a className="dark:bg-[#04274A] rounded-b-lg py-3 flex justify-center items-center dark:text-[#3A92FF] bg-[#F1F8FF] text-[#3A92FF]">Ver tudo</a>
       </div>
       
      </section>
      </div>
      </div>
    </main>
  );
}
