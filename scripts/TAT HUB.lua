local Library = loadstring(game:HttpGet("https://raw.githubusercontent.com/Robojini/Tuturial_UI_Library/main/UI_Template_1"))()

local Window = Library.CreateLib("TAT DOORS MENU", "RJTheme3")

local TabFun = Window:NewTab("FUN")
local SectionDead = TabFun:NewSection("Die functions:")

SectionDead:NewToggle("Suffocation", "Kill you with oxygen suffocation", function(state)
    if state then
        game.ReplicatedStorage.RemotesFolder.Underwater:FireServer(true)
    else
        game.ReplicatedStorage.RemotesFolder.Underwater:FireServer(false)
    end
end)
