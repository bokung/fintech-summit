<template>
  <div class="flex flex-wrap mx-[-15px]">
    <div class="w-full px-[15px]">
      <div class="card-wrap">
        <h3 class="card-title">Trading Objectives</h3>
        <div class="content">
          <!-- trading-row start-->
          <div class="flex flex-wrap mx-[-15px]">
            <div class="xl:w-6/12 w-full px-[15px]">
              <!-- trading-card start-->
              <div class="bg-white p-[30px] rounded-[15px] mb-[30px] dark:bg-toggle">
                <p class="text-dark text-[18px] leading-[1.5] tracking-[-0.05px] mb-[20px] dark:text-white">
                  Minimum Trading Days
                  <svg
                    class="inline-block w-[17px] h-[17px] fill-dark/70 ml-[5px] dark:fill-white"
                    focusable="false"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"></path>
                  </svg>
                </p>
                <p class="flex flex-wrap items-center justify-between text-dark text-[18px] leading-[1.5] tracking-[-0.05px] mb-[15px] dark:text-white">
                  <span>Minimum</span>
                  <span>10 days</span>
                </p>
                <p class="flex flex-wrap items-center justify-between text-dark text-[18px] leading-[1.5] tracking-[-0.05px] mb-[15px] dark:text-white">
                  <span>Current Result</span>
                  <span class="text-primary">2 days</span>
                </p>
                <p>
                  <span class="text-primary bg-primary/20 text-[14px] py-[6px] px-[16px] rounded-[5px]">Ongoing</span>
                </p>
              </div>
              <!-- trading-card end-->
            </div>

            <div class="xl:w-6/12 w-full px-[15px]">
              <!-- trading-card start-->
              <div class="bg-white p-[30px] rounded-[15px] mb-[30px] dark:bg-toggle">
                <p class="text-dark text-[18px] leading-[1.5] tracking-[-0.05px] mb-[20px] dark:text-white">
                  Daily Loss Limit
                  <svg
                    class="inline-block w-[17px] h-[17px] fill-dark/70 ml-[5px] dark:fill-white"
                    focusable="false"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"></path>
                  </svg>
                </p>
                <p class="flex flex-wrap items-center justify-between text-dark text-[18px] leading-[1.5] tracking-[-0.05px] mb-[15px] dark:text-white">
                  <span>Max. Loss</span>
                  <span>${{ dailyLossLimit }}</span>
                </p>
                <p class="flex flex-wrap items-center justify-between text-dark text-[18px] leading-[1.5] tracking-[-0.05px] mb-[15px] dark:text-white">
                  <span>Max. Loss recorded</span>
                  <span class="text-primary">${{ maxLossRecorded }}</span>
                </p>
                <p>
                  <span class="text-primary bg-primary/20 text-[14px] py-[6px] px-[16px] rounded-[5px]">Ongoing</span>
                </p>
              </div>
              <!-- trading-card end-->
            </div>
          </div>
          <!-- trading-row end-->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TradingOverview",
  data() {
    return {
      isMenubar: false,
      isUserInfo: false,
      isNotification: false,
      isSidebar: true,
    };
  },
};
</script>

<style scoped>
</style>