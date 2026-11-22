## 2026-11-12T15:58:36Z
工作目录：/Volumes/500GB/Ydpen/halflife_app
状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m1_1

【必读输入文件】
- /Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md
- /Volumes/500GB/Ydpen/.agents/teamwork/orch_m1/SCOPE.md
- /Volumes/500GB/Ydpen/.agents/teamwork/explorer_survey_1/handoff.md

【任务目标】
深入勘查构建脚本 tools/build_amr.py 与部署脚本 tools/install_amr.py，产出具体的动态库隔离与构建适配方案：
1. 检查 tools/build_amr.py 中所有涉及 libwl_center.so 的代码（包括 BINS_DIR 拷贝、pack_amr.py 打包参数传入、zip 校验）。
2. 确保 AMR 包内 libs/arm64 与 libs/arm64-orange 仅包含 libjsapi_hl.so，彻底排除 libwl_center.so。
3. 检查 tools/install_amr.py 中的解包校验，删除对包内 libwl_center.so 的强校验逻辑。
4. 确保 install_amr.py 将本地 libs/libwl_center.so 推送至 /userdisk/halflife/libwl_center.so，并将所有 ADB 调用显式指定目标设备序列号 -s 9DA2200007506350。
5. 在你的状态目录下输出 handoff.md，提供精准的行号定位、修改方案与验证方法。严禁直接修改业务代码或构建脚本。
