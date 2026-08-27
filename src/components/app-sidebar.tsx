'use client'

import { Home, Search, Settings, Swords } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Separator } from "./ui/separator"
import { Fragment } from "react"
import LangSwitcher from "./LangSwitcher"
import { useT } from "@/hooks/useT"

export function AppSidebar() {
  const t = useT()

  const items = [
    { title: t('sidebar.home'), url: "/", icon: Home },
    { title: t('sidebar.detail'), url: "/list", icon: Search },
    { title: t('sidebar.gameMode'), url: "/game-mode", icon: Swords },
    { title: t('sidebar.settings'), url: "/search", icon: Settings },
  ]

  return (
    <Sidebar className="w-48">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="items-center justify-center mb-4">Games</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <Fragment key={item.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="items-center justify-center">
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <Separator className="border-1" />
                </Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="pb-4 px-3">
        <div className="font-mono text-[10px] uppercase tracking-widest mb-1.5" style={{ color: '#4a5e3a' }}>
          {t('sidebar.language')}
        </div>
        <LangSwitcher />
      </SidebarFooter>
    </Sidebar>
  )
}
