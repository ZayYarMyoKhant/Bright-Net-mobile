
"use server";

import { createClient } from "@/lib/supabase/server";

export async function createTypingBattle(player1Id: string, player2Id: string) {
    const supabase = createClient();

    try {
        const text = "This is a sample typing text for the battle.";

        const { data, error } = await supabase
            .from('typing_battles')
            .insert({
                player1_id: player1Id,
                player2_id: player2Id,
                status: 'requesting',
                current_text: text, // Set the AI-generated text
            })
            .select('id')
            .single();
        
        if (error) throw error;
        return { success: true, data };

    } catch (error) {
        console.error("Error in createTypingBattle:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown database error occurred.";
        return { success: false, error: errorMessage };
    }
}

export async function finishTypingRound(battleId: string) {
     const supabase = createClient();
     try {
        const { error } = await supabase.rpc('finish_typing_round', { battle_id_param: battleId });
        if (error) throw error;
        return { success: true };
     } catch (error) {
        console.error("Error in finishTypingRound:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown database error occurred.";
        return { success: false, error: errorMessage };
     }
}
