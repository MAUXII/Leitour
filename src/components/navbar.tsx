import Image from "next/image"
import { IoIosSearch } from "react-icons/io";
import { FaRegBell } from "react-icons/fa";

export const Navbar = () =>{
    return(
        <div className="flex fixed z-10 pr-[368px]   h-[90px] py-1 px-3 w-full justify-between items-center dark:bg-[#131C29] bg-[#FFFFFF] border-b rtl:border-r-0 dark:border-gray-700 ">
            <a href="#" className="flex self-start">
        <Image className="w-auto h-20" src="/icons/LogoLeitour.svg" width={10} height={10} alt="" />
    </a>
    <div className=" w-full flex  max-w-[523px]">
  <div className="relative w-full   max-w-[523px]">
    <input type="text" className="py-3 bg-transparent px-4 pe-11 block w-full max-w-[523px] ring-2 ring-[#EEEEEE] dark:ring-[#EEEEEE]/5 focus:ring-2 outline-none focus:ring-blue-500/20  rounded-lg text-sm dark:text-gray-400 " placeholder="Pesquisar" />
    <div className="absolute inset-y-0 end-0   flex items-center pointer-events-none z-20 pe-4">
    <IoIosSearch />
    </div>
  </div>
</div>
<a className="cursor-pointer relative">

  <FaRegBell/>
  <span className="flex absolute top-0 end-0 size-2  -mt-1.5 -me-1.5">
    <span className="animate-ping absolute inline-flex size-full rounded-full bg-blue-400 opacity-75 dark:bg-blue-600"></span>
    <span className="relative inline-flex rounded-full size-2 bg-blue-500"></span>
  </span>


</a>
        </div>
    )
}