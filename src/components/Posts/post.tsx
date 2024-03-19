import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { MdComment } from "react-icons/md";
import { BiRepost } from "react-icons/bi";
import { FaHeart } from "react-icons/fa";
import { RiShareForwardFill } from "react-icons/ri";



export const Post = () =>{
    return(
        <div className="w-full flex flex-col gap-2 py-6 px-4 border-2 rounded-lg border-[#f4f4f4] dark:border-[#f4f4f4]/10 dark:bg-[#15202B]/50 bg-[#FFFFFF]  ">
            <div className="flex gap-[10px]">
                
             <div className="flex w-[40px] h-[40px] aspect-square  rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611731.jpg?t=st=1710547888~exp=1710551488~hmac=ba4ed000ff12b3440effc4e302dd4638f2560818fbe6317061baca61e0270d7c&w=826')"}}></div>
             <div className="flex flex-col gap-1">
                <div className="flex w-full  justify-between items-center">
             <div className="flex gap-[10px]  ">
                <p className="text-sm font-semibold">Lucas Rabaquim</p>
                <div className="flex gap-1 font-light text-sm text-[#A6A6A6] ">
                    <p>@rabaquim</p>
                 <p>• agora</p>
             </div>
             

             </div>
             <HiOutlineDotsHorizontal />
             </div>
             <p className=" text-sm font-light">Lorem ipsum dolor sit amet consectetur. Vestibulum nisl risus risus amet sed blandit. Enim consequat tortor mollis enim amet non elit duis.</p>

             <div className="flex gap-4 dark:text-[#B7B7B7] text-[#8b8b8b] mt-2 items-center">
                <MdComment className="cursor-pointer hover:text-[#4983f6] " />
                <BiRepost className="cursor-pointer hover:text-[#4983f6] text-2xl"/>
                <FaHeart className="cursor-pointer hover:text-[#4983f6] " />
                <RiShareForwardFill className="cursor-pointer hover:text-[#4983f6] text-xl" />
             </div>

             </div>
             </div>
             
        </div>
    )
}