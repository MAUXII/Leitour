export const CreateP = () =>{
    return(
        <div className="w-full flex flex-col gap-1 py-[10px]  border-2 rounded-lg dark:bg-[#15202B]/50 bg-[#FFFFFF] border-[#f4f4f4] dark:border-[#f4f4f4]/10" style={{ boxShadow: '0px 1.5px 5px 0px rgba(19, 88, 227, 0.30)' }}>
            <p className="text-xs px-[20px]">Poste algo</p>
            <div className="w-full mt-1 h-[1px] bg-[#EEEEEE] dark:bg-[#f4f4f4]/10"></div>
            <div className="flex gap-[10px] my-4 ">
            <div className="flex w-[35px] h-[35px] aspect-square ml-[20px] rounded-full bg-gray-200 bg-no-repeat bg-cover" style={{backgroundImage: "url('https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671159.jpg?t=st=1710215038~exp=1710218638~hmac=8fbc6f14e022d1ada3127a55bc33079f72090e2cfc669fcdc79c60bfc4cb39c6&w=826')"}}></div>
            <input placeholder="O que vem na sua mente?" className="bg-transparent mr-[20px]  w-full text-sm focus:outline-none focus:border-[#145CEC]/40 border-b border-[#fff0]" />
            <input type="file" placeholder="" className="custom-file-input flex mr-[20px] w-[23px] aspect-square "></input>
            <button type="submit" className="flex bg-[#1358E3] hover:bg-[#004add] text-white w-fit self-start  py-2 px-4 mx-[20px] rounded-full" style={{ boxShadow: '0px 1.5px 5px 0px rgba(19, 88, 227, 0.30)' }}>Postar</button>
            </div>
            
        </div>
    )
}