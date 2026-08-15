import {getUsageStatus, getUserProStatus} from "@/lib/usage";

import {createTRPCRouter,protectedProcedure} from "@/trpc/init";

export const usageRouter = createTRPCRouter({
    status: protectedProcedure.query(async () =>{   
    try{
        const result = await getUsageStatus();
        return result;
    }catch{
        return null;
       
    }}),
    isPro: protectedProcedure.query(async () => {
        try {
            const isPro = await getUserProStatus();
            return { isPro };
        } catch {
            return { isPro: false };
        }
    }),
})